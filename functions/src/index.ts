import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, onRequest } from "firebase-functions/v2/https";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";
import * as logger from "firebase-functions/logger";

// --- INICIALIZACIÓN DE SERVICIOS ---

// 1. Inicialización de Firebase Admin
initializeApp();
const db = getFirestore();

// 2. Inicialización de Stripe (Versión 14.0.0 y Secreto del Entorno)
// Se asume que la variable de entorno se llama 'STRIPE_SECRET_KEY'
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  logger.error("STRIPE_SECRET_KEY no está configurada.");
}
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: "2023-10-16", // Versión requerida por Stripe 14.x
});

// 3. Inicialización de Gemini (Versión ^0.2.1 y Clave Secreta del Entorno)
// Se asume que la variable de entorno se llama 'GEMINI_API_KEY'
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  logger.error("GEMINI_API_KEY no está configurada.");
}
const ai = new GoogleGenAI({ apiKey: geminiApiKey! });

// --- ENDPOINTS DE FUNCIONALIDAD ---

/**
 * Función 1: Webhook para recibir notificaciones de Stripe
 * Maneja el evento de sesión de checkout completada para asignar créditos.
 * @type {onRequest}
 */
export const stripeWebhook = onRequest(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Método no permitido.");
    }

    let event: Stripe.Event;
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      // Reconstruye el evento de Stripe para verificar la firma
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature!,
        webhookSecret!
      );
    } catch (err: any) {
      logger.error("Error al verificar la firma de Stripe:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Maneja el evento de pago exitoso
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const credits = session.metadata?.credits;

      if (userId && credits) {
        const creditCount = parseInt(credits);
        const userRef = db.collection("users").doc(userId);

        try {
          // Asignación de Créditos (Actualización atómica en Firestore)
          await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const currentCredits = userDoc.data()?.credits || 0;
            const newCredits = currentCredits + creditCount;

            transaction.update(userRef, { credits: newCredits });
          });

          logger.info(`Créditos (${creditCount} CC) asignados al usuario: ${userId}`);
          return res.json({ received: true });

        } catch (error) {
          logger.error("Error al asignar créditos en Firestore:", error);
          return res.status(500).end();
        }
      }
    }

    return res.json({ received: true });
  }
);

/**
 * Función 2: Función Callable para canjear créditos por un servicio.
 * Lógica: Verifica, cobra y devuelve éxito o fracaso.
 * @type {onCall}
 */
export const canjearCreditos = onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    const { cost, resourceType } = request.data;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new Error("Petición no autenticada.");
    }

    if (typeof cost !== "number" || cost <= 0) {
      throw new Error("Costo no válido.");
    }

    const userRef = db.collection("users").doc(userId);

    try {
      // Transacción atómica para asegurar que el débito sea seguro
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentCredits = userDoc.data()?.credits || 0;

        if (currentCredits < cost) {
          throw new Error("Créditos insuficientes.");
        }

        const newCredits = currentCredits - cost;
        transaction.update(userRef, { credits: newCredits });
      });

      logger.info(
        `Usuario ${userId} canjeó ${cost} CC por ${resourceType}.`
      );
      return { success: true, message: "Créditos canjeados con éxito." };

    } catch (error: any) {
      logger.error(`Error al canjear créditos: ${error.message}`);
      // Devuelve un error que el frontend pueda manejar
      return { success: false, message: error.message };
    }
  }
);


/**
 * Función 3: Health Check de la IA y el Backend.
 * Prueba la conectividad a Gemini.
 * @type {onCall}
 */
export const aiHealthCheck = onCall(
  { secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = "What is your name? Respond only with the name 'Carmelita'.";

      const response = await model.generateContent({
        contents: prompt,
      });

      const responseText = response.text.trim();

      if (responseText.includes("Carmelita")) {
        return {
          status: "OK",
          message: "Conexión a Gemini exitosa. Respuesta del modelo: " + responseText,
        };
      } else {
        throw new Error("La respuesta de Gemini no fue la esperada.");
      }
    } catch (error: any) {
      logger.error("Error en la conexión a Gemini:", error);
      throw new Error("Fallo en la prueba de salud de la IA: " + error.message);
    }
  }
);
