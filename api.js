// Configuration de l'API Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwSP08B2AA5mTiUcw1SwS_1exydXDeCOf1jNjQsxSIhPo0J8kLUutIXkRFH1DuvguiXBA/exec";

// Récupère le nombre de participants
async function getParticipantCount() {
  try {
    const response = await fetch(`${API_URL}?action=count`);
    const data = await response.json();
    return data.success ? data.count : 0;
  } catch (error) {
    console.error("Erreur lors de la récupération du compteur:", error);
    return 0;
  }
}

// Vérifie si un email existe déjà
async function checkEmailExists(email) {
  try {
    const response = await fetch(`${API_URL}?action=check&email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data.success ? data.exists : false;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    return false;
  }
}

// Enregistre une participation
async function saveParticipation(participationData) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors', // Important pour Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(participationData)
    });
    
    // Avec no-cors, on ne peut pas lire la réponse
    // On considère que c'est réussi si pas d'erreur
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'enregistrement:", error);
    return { success: false, message: error.message };
  }
}
