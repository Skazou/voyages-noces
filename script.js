// ========================================
// SYSTÈME DE SAUVEGARDE DE L'ÉTAT DU JEU
// ========================================

// État du jeu
const gameState = {
  currentScreen: 0,
  score: 200,
  revealedClues: {
    gratuit: 0,
    voyage: 0,
    nature: 0,
    equipement: 0,
    organisation: 0
  },
  totalCluesRevealed: 0
};

let currentUserEmail = null;

// Charger l'état du jeu depuis le localStorage
function loadGameState() {
  const saved = localStorage.getItem('gameState');
  if (saved) {
    const savedState = JSON.parse(saved);
    gameState.score = savedState.score;
    gameState.revealedClues = savedState.revealedClues;
    gameState.totalCluesRevealed = savedState.totalCluesRevealed;
    console.log('État du jeu restauré:', gameState);
  }
}

// Sauvegarder l'état du jeu dans le localStorage
function saveGameState() {
  localStorage.setItem('gameState', JSON.stringify(gameState));
  console.log('État du jeu sauvegardé');
}

// Charger l'email sauvegardé
function loadUserEmail() {
  const saved = localStorage.getItem('userEmail');
  if (saved) {
    currentUserEmail = saved;
    console.log('Email restauré:', currentUserEmail);
    return true;
  }
  return false;
}

// Sauvegarder l'email
function saveUserEmail(email) {
  localStorage.setItem('userEmail', email);
  currentUserEmail = email;
  console.log('Email sauvegardé:', email);
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Page chargée, initialisation...');
  
  // Charger l'email et l'état du jeu
  const emailExists = loadUserEmail();
  loadGameState();
  
  // Charger le compteur de participants
  await updateParticipantCount();
  
  // Initialiser les écouteurs d'événements
  initEventListeners();
  
  // Afficher l'écran approprié
  if (emailExists) {
    showScreen(1); // Aller directement à l'accueil
  } else {
    showScreen(0); // Afficher l'écran de saisie email
  }
  
  console.log('Initialisation terminée');
});

// ========================================
// VÉRIFICATION EMAIL
// ========================================

// Vérifier l'email
async function verifyEmail() {
  const emailInput = document.getElementById('verification-email');
  const email = emailInput.value.trim();
  
  if (!email) {
    alert('Veuillez entrer votre email');
    return;
  }
  
  // Vérifier si l'email a déjà participé
  const emailExists = await checkEmailExists(email);
  
  if (emailExists) {
    alert('Cet email a déjà participé au jeu !');
    return;
  }
  
  // Email valide, sauvegarder et continuer
  saveUserEmail(email);
  showScreen(1); // Aller à l'accueil
}

// Met à jour le compteur de participants
async function updateParticipantCount() {
  try {
    const count = await getParticipantCount();
    const counterElement = document.getElementById('participant-count');
    if (counterElement) {
      counterElement.textContent = count;
    }
  } catch (error) {
    console.error('Erreur compteur:', error);
  }
}

// Initialise tous les écouteurs d'événements
function initEventListeners() {
  console.log('Initialisation des écouteurs...');
  
  // Bouton de vérification email
  const verifyBtn = document.getElementById('verify-email-btn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', verifyEmail);
  }
  
  // Permettre d'appuyer sur Entrée pour l'email
  const emailInput = document.getElementById('verification-email');
  if (emailInput) {
    emailInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verifyEmail();
      }
    });
  }
  
  // Bouton "Commencer l'aventure"
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      console.log('Clic sur Commencer l\'aventure');
      showScreen(2);
      initCluesScreen();
    });
    console.log('Écouteur start-btn ajouté');
  } else {
    console.error('Bouton start-btn introuvable !');
  }
  
  // Bouton "Soumettre ma réponse"
  const submitCluesBtn = document.getElementById('submit-clues-btn');
  if (submitCluesBtn) {
    submitCluesBtn.addEventListener('click', () => {
      console.log('Clic sur Soumettre ma réponse');
      showScreen(3);
      initAnswerScreen();
    });
  }
  
  // Bouton "Envoyer"
  const submitAnswerBtn = document.getElementById('submit-answer-btn');
  if (submitAnswerBtn) {
    submitAnswerBtn.addEventListener('click', showConfirmationModal);
  }
  
  // Boutons de la modale de confirmation
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirm = document.getElementById('modal-confirm');
  
  if (modalCancel) {
    modalCancel.addEventListener('click', hideConfirmationModal);
  }
  
  if (modalConfirm) {
    modalConfirm.addEventListener('click', submitAnswer);
  }
}

// Affiche un écran spécifique
function showScreen(screenNumber) {
  console.log('Affichage écran', screenNumber);
  
  // Cacher tous les écrans
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Afficher l'écran demandé
  const screen = document.getElementById(`screen-${screenNumber}`);
  if (screen) {
    screen.classList.add('active');
    gameState.currentScreen = screenNumber;
    console.log('Écran', screenNumber, 'affiché');
    
    // Scroll en haut de la page
    window.scrollTo(0, 0);
  } else {
    console.error('Écran', screenNumber, 'introuvable !');
  }
}

// Initialise l'écran des indices
function initCluesScreen() {
  console.log('Initialisation écran indices');
  
  const container = document.getElementById('clues-container');
  if (!container) {
    console.error('Container clues-container introuvable !');
    return;
  }
  
  container.innerHTML = '';
  
  // Créer les cartes de catégories
  Object.keys(CLUES).forEach(categoryKey => {
    const category = CLUES[categoryKey];
    const card = createCategoryCard(categoryKey, category);
    container.appendChild(card);
  });
  
  // Restaurer les indices déjà révélés
  restoreRevealedClues();
  
  // Révéler automatiquement l'indice gratuit après un court délai (seulement si pas déjà révélé)
  if (gameState.revealedClues.gratuit === 0) {
    setTimeout(() => {
      revealClue('gratuit');
    }, 100);
  }
  
  // Mettre à jour les statistiques
  updateCluesStats();
}

// Restaure les indices déjà révélés
function restoreRevealedClues() {
  Object.keys(CLUES).forEach(categoryKey => {
    const category = CLUES[categoryKey];
    const revealedCount = gameState.revealedClues[categoryKey];
    
    // Afficher tous les indices déjà révélés
    for (let i = 0; i < revealedCount; i++) {
      const content = document.getElementById(`clues-${categoryKey}`);
      if (content) {
        const clueElement = document.createElement('div');
        clueElement.className = 'clue-item';
        clueElement.textContent = category.clues[i];
        content.appendChild(clueElement);
      }
    }
    
    // Mettre à jour le bouton
    const button = document.querySelector(`button[data-category="${categoryKey}"]`);
    if (button && revealedCount >= category.clues.length) {
      if (categoryKey === 'gratuit') {
        button.style.display = 'none';
      } else {
        button.disabled = true;
        button.textContent = 'Tous les indices révélés';
      }
    }
  });
}

// Met à jour les statistiques des indices
function updateCluesStats() {
  const cluesCountElement = document.getElementById('clues-count');
  const scoreRemainingElement = document.getElementById('score-remaining');
  
  if (cluesCountElement) {
    cluesCountElement.textContent = gameState.totalCluesRevealed;
  }
  
  if (scoreRemainingElement) {
    scoreRemainingElement.textContent = gameState.score;
  }
}

// Crée une carte de catégorie
function createCategoryCard(categoryKey, category) {
  const card = document.createElement('div');
  card.className = 'clue-card';
  card.dataset.category = categoryKey;
  
  const header = document.createElement('div');
  header.className = 'clue-header';
  header.innerHTML = `
    <span class="clue-icon">${category.icon}</span>
    <h3>${category.title}</h3>
    <span class="clue-cost">${category.cost === 0 ? 'Gratuit' : `-${category.cost} points`}</span>
  `;
  
  const content = document.createElement('div');
  content.className = 'clue-content';
  content.id = `clues-${categoryKey}`;
  
  const button = document.createElement('button');
  button.className = 'clue-reveal-btn';
  button.textContent = category.cost === 0 ? 'Voir l\'indice' : `Consulter un indice (-${category.cost} points)`;
  button.dataset.category = categoryKey;
  
  // Désactiver le bouton si tous les indices sont révélés
  if (gameState.revealedClues[categoryKey] >= category.clues.length) {
    button.disabled = true;
    button.textContent = 'Tous les indices révélés';
  }
  
  button.addEventListener('click', () => revealClue(categoryKey));
  
  card.appendChild(header);
  card.appendChild(content);
  card.appendChild(button);
  
  return card;
}

// Révèle un indice d'une catégorie
function revealClue(categoryKey) {
  console.log('Révélation indice:', categoryKey);
  
  const category = CLUES[categoryKey];
  const currentIndex = gameState.revealedClues[categoryKey];
  
  // Vérifier s'il reste des indices à révéler
  if (currentIndex >= category.clues.length) {
    console.log('Tous les indices déjà révélés pour', categoryKey);
    return;
  }
  
  // Déduire les points (sauf pour gratuit)
  if (category.cost > 0) {
    gameState.score -= category.cost;
    gameState.totalCluesRevealed++;
  }
  
  // Ajouter l'indice au DOM
  const content = document.getElementById(`clues-${categoryKey}`);
  if (!content) {
    console.error('Container clues-' + categoryKey + ' introuvable !');
    return;
  }
  
  const clueElement = document.createElement('div');
  clueElement.className = 'clue-item';
  clueElement.textContent = category.clues[currentIndex];
  content.appendChild(clueElement);
  
  // Mettre à jour l'état
  gameState.revealedClues[categoryKey]++;
  
  // NOUVEAU : Sauvegarder l'état du jeu
  saveGameState();
  
  // Mettre à jour les statistiques
  updateCluesStats();
  
  // Mettre à jour le bouton
  const button = document.querySelector(`button[data-category="${categoryKey}"]`);
  
  if (button && gameState.revealedClues[categoryKey] >= category.clues.length) {
    // Pour la catégorie gratuite, on cache complètement le bouton
    if (categoryKey === 'gratuit') {
      button.style.display = 'none';
    } else {
      button.disabled = true;
      button.textContent = 'Tous les indices révélés';
    }
  }
  
  console.log('Indice révélé, état:', gameState.revealedClues[categoryKey], '/', category.clues.length);
}

// Initialise l'écran de réponse
function initAnswerScreen() {
  console.log('Initialisation écran réponse');
  
  // Remplir l'email
  const emailDisplay = document.getElementById('email-display');
  if (emailDisplay) {
    emailDisplay.value = currentUserEmail;
  }
  
  // Vérifier si Tom Select est déjà initialisé
  const pays1Element = document.getElementById('pays1');
  const pays2Element = document.getElementById('pays2');
  
  if (!pays1Element || !pays2Element) {
    console.error('Éléments pays1 ou pays2 introuvables !');
    return;
  }
  
  // Détruire les instances existantes si elles existent
  if (pays1Element.tomselect) {
    pays1Element.tomselect.destroy();
  }
  if (pays2Element.tomselect) {
    pays2Element.tomselect.destroy();
  }
  
  // Initialiser Tom Select pour les pays avec drapeaux
  const pays1Select = new TomSelect('#pays1', {
    options: COUNTRIES.map(country => ({ 
      value: country.name, 
      text: `${country.flag} ${country.name}` 
    })),
    placeholder: 'Choisissez un pays',
    maxItems: 1,
    create: false,
    sortField: 'text',
    onChange: validateForm,
    render: {
      option: function(data, escape) {
        return '<div>' + data.text + '</div>';
      },
      item: function(data, escape) {
        return '<div>' + data.text + '</div>';
      }
    }
  });
  
  const pays2Select = new TomSelect('#pays2', {
    options: COUNTRIES.map(country => ({ 
      value: country.name, 
      text: `${country.flag} ${country.name}` 
    })),
    placeholder: 'Choisissez un pays',
    maxItems: 1,
    create: false,
    sortField: 'text',
    onChange: validateForm,
    render: {
      option: function(data, escape) {
        return '<div>' + data.text + '</div>';
      },
      item: function(data, escape) {
        return '<div>' + data.text + '</div>';
      }
    }
  });
  
  // Empêcher de sélectionner le même pays deux fois
  pays1Select.on('change', () => {
    const selectedPays1 = pays1Select.getValue();
    pays2Select.clearOptions();
    pays2Select.addOptions(
      COUNTRIES
        .filter(c => c.name !== selectedPays1)
        .map(country => ({ 
          value: country.name, 
          text: `${country.flag} ${country.name}` 
        }))
    );
    pays2Select.refreshOptions(false);
  });
  
  pays2Select.on('change', () => {
    const selectedPays2 = pays2Select.getValue();
    pays1Select.clearOptions();
    pays1Select.addOptions(
      COUNTRIES
        .filter(c => c.name !== selectedPays2)
        .map(country => ({ 
          value: country.name, 
          text: `${country.flag} ${country.name}` 
        }))
    );
    pays1Select.refreshOptions(false);
  });
  
  // Validation en temps réel
  const prenomInput = document.getElementById('prenom');
  
  if (prenomInput) {
    prenomInput.addEventListener('input', validateForm);
  }
}

// Valide le formulaire de réponse
function validateForm() {
  const prenom = document.getElementById('prenom').value.trim();
  const pays1 = document.getElementById('pays1').value;
  const pays2 = document.getElementById('pays2').value;
  
  const submitBtn = document.getElementById('submit-answer-btn');
  if (submitBtn) {
    submitBtn.disabled = !(prenom && pays1 && pays2);
  }
}

// Affiche la modale de confirmation
function showConfirmationModal() {
  console.log('Affichage modale confirmation');
  const modal = document.getElementById('confirmation-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

// Cache la modale de confirmation
function hideConfirmationModal() {
  console.log('Fermeture modale confirmation');
  const modal = document.getElementById('confirmation-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Soumet la réponse finale
async function submitAnswer() {
  console.log('Soumission de la réponse');
  hideConfirmationModal();
  
  // Afficher un loader
  const submitBtn = document.getElementById('submit-answer-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';
  }
  
  // Récupérer les données
  const prenom = document.getElementById('prenom').value.trim();
  const email = currentUserEmail;
  const pays1 = document.getElementById('pays1').value;
  const pays2 = document.getElementById('pays2').value;
  
  // Préparer les données
  const participationData = {
    prenom: prenom,
    email: email,
    pays1: pays1,
    pays2: pays2,
    cluesRevealed: gameState.totalCluesRevealed
  };
  
  // Envoyer les données
  const result = await saveParticipation(participationData);
  
  if (result.success) {
    // Nettoyer le localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('gameState');
    
    showScreen(4);
  } else {
    alert('Une erreur est survenue. Veuillez réessayer.');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer';
    }
  }
}
