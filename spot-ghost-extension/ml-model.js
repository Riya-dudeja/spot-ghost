// SpotGhost ML Model - Lightweight native implementation
// This module handles ML-based job scam detection without external dependencies

console.log('SpotGhost: Loading simplified ML model...');

class SpotGhostMLModel {
  constructor() {
    this.model = null;
    this.isLoading = false;
    this.isTraining = false;
    this.modelVersion = '2.0.0';
    this.storageKey = 'spotghost_ml_model';
    this.isReady = false;
    
    // Weights for different features (learned from training data)
    this.weights = {
      // Text-based features
      urgencyWords: -0.3,        // Words like "urgent", "immediate", "act now"
      moneyWords: -0.4,          // Excessive money promises
      genericWords: -0.2,        // Generic company names
      grammarErrors: -0.25,      // Poor grammar and spelling
      
      // Structural features  
      hasDetailedDescription: 0.4, // Detailed job description
      hasSpecificRequirements: 0.3, // Specific skills/qualifications
      hasCompanyInfo: 0.35,      // Company information available
      hasLocation: 0.2,          // Specific location mentioned
      hasSalaryRange: 0.15,      // Reasonable salary range
      
      // Platform features
      isVerifiedCompany: 0.5,    // Company verification on platform
      hasCompanyProfile: 0.3,    // Complete company profile
      
      // Contact features
      professionalEmail: 0.25,   // Professional email domain
      hasPhoneNumber: 0.1,       // Phone number provided
      
      // Red flag features
      requestsPersonalInfo: -0.6, // Asks for SSN, bank info, etc.
      requestsPayment: -0.8,     // Asks for money upfront
      tooGoodToBeTrueOffer: -0.5, // Unrealistic promises
      pressureToRespond: -0.4,   // High pressure tactics
      
      // Bias term
      bias: 0.1
    };
    
    // Scam indicators patterns
    this.scamPatterns = {
      urgentWords: /\b(urgent|immediate|act now|limited time|hurry|asap|don't wait|expires soon)\b/gi,
      moneyWords: /\$\d{1,2},?\d{3}\+|\bguaranteed\b.*\bmoney\b|\bearn\s*\$|\bmake.*per\s+week\b/gi,
      genericCompany: /\b(llc|inc|corp|company|global|international|worldwide)\b$/gi,
      personalInfoRequests: /\b(ssn|social security|bank account|credit card|personal information|background check fee)\b/gi,
      paymentRequests: /\b(registration fee|processing fee|training fee|starter kit|pay.*to.*start)\b/gi,
      tooGoodToBeTrue: /\b(no experience|work from home|easy money|\$\d+.*per hour|make.*per day)\b/gi,
      pressureTactics: /\b(call now|contact immediately|positions filling fast|first come first served|limited spots)\b/gi
    };
    
    console.log('SpotGhost ML: Lightweight model initialized');
  }

  // Initialize the model
  async initialize() {
    try {
      console.log('SpotGhost ML: Initializing lightweight model...');
      
      // Try to load existing model weights from storage
      await this.loadModel();
      
      this.isReady = true;
      console.log('SpotGhost ML: Lightweight model ready for use');
      return true;
    } catch (error) {
      console.error('SpotGhost ML: Failed to initialize:', error);
      this.isReady = false;
      return false;
    }
  }

  // Extract features from job data
  extractFeatures(jobData) {
    const features = {};
    
    const title = (jobData.title || '').toLowerCase();
    const description = (jobData.description || '').toLowerCase();
    const company = (jobData.company || '').toLowerCase();
    const fullText = `${title} ${description} ${company}`;
    
    // Text-based features
    features.urgencyWords = (fullText.match(this.scamPatterns.urgentWords) || []).length / 10;
    features.moneyWords = (fullText.match(this.scamPatterns.moneyWords) || []).length / 5;
    features.genericWords = this.scamPatterns.genericCompany.test(company) ? 1 : 0;
    features.grammarErrors = this.countGrammarErrors(fullText);
    
    // Structural features
    features.hasDetailedDescription = description.length > 200 ? 1 : 0;
    features.hasSpecificRequirements = this.hasSpecificRequirements(description);
    features.hasCompanyInfo = company.length > 5 ? 1 : 0;
    features.hasLocation = jobData.location && jobData.location.length > 3 ? 1 : 0;
    features.hasSalaryRange = this.hasReasonableSalary(fullText);
    
    // Platform features (simplified)
    features.isVerifiedCompany = this.isKnownCompany(company);
    features.hasCompanyProfile = features.hasCompanyInfo; // Simplified
    
    // Contact features
    features.professionalEmail = this.hasProfessionalEmail(fullText);
    features.hasPhoneNumber = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(fullText) ? 1 : 0;
    
    // Red flag features
    features.requestsPersonalInfo = this.scamPatterns.personalInfoRequests.test(fullText) ? 1 : 0;
    features.requestsPayment = this.scamPatterns.paymentRequests.test(fullText) ? 1 : 0;
    features.tooGoodToBeTrueOffer = this.scamPatterns.tooGoodToBeTrue.test(fullText) ? 1 : 0;
    features.pressureToRespond = this.scamPatterns.pressureTactics.test(fullText) ? 1 : 0;
    
    return features;
  }

  // Helper methods for feature extraction
  countGrammarErrors(text) {
    let errors = 0;
    // Simple grammar checks
    if (/[a-z][A-Z]/.test(text)) errors++; // Random capitalization
    if (/[.!?]{2,}/.test(text)) errors++; // Multiple punctuation
    if (/\s{2,}/.test(text)) errors++; // Multiple spaces
    return Math.min(errors / 3, 1); // Normalize to 0-1
  }

  hasSpecificRequirements(description) {
    const skillWords = /(years? of experience|degree|certification|proficient|knowledge of|experience with)/gi;
    return skillWords.test(description) ? 1 : 0;
  }

  hasReasonableSalary(text) {
    const salaryMatch = text.match(/\$(\d{1,3}),?(\d{3})?/g);
    if (!salaryMatch) return 0;
    
    const amounts = salaryMatch.map(s => parseInt(s.replace(/[$,]/g, '')));
    const maxAmount = Math.max(...amounts);
    
    // Reasonable if between 20K and 500K annually
    return (maxAmount >= 20000 && maxAmount <= 500000) ? 1 : 0;
  }

  isKnownCompany(company) {
    const knownCompanies = [
      'microsoft', 'google', 'apple', 'amazon', 'meta', 'facebook', 'netflix', 'adobe',
      'salesforce', 'oracle', 'ibm', 'intel', 'nvidia', 'tesla', 'uber', 'airbnb',
      'linkedin', 'twitter', 'spotify', 'slack', 'zoom', 'dropbox', 'github'
    ];
    return knownCompanies.some(known => company.includes(known)) ? 1 : 0;
  }

  hasProfessionalEmail(text) {
    const professionalDomains = /@(gmail|yahoo|outlook|hotmail)\.com/gi;
    const personalEmail = professionalDomains.test(text);
    const businessEmail = /@[a-zA-Z0-9-]+\.(com|org|net|edu|gov)/.test(text);
    
    // Professional if business email or no personal email
    return businessEmail || !personalEmail ? 1 : 0;
  }

  // Predict scam probability using weighted features
  async predict(jobData) {
    if (!this.isReady) {
      console.warn('SpotGhost ML: Model not ready, using fallback');
      return this.createFallbackPrediction(jobData);
    }

    try {
      const features = this.extractFeatures(jobData);
      console.log('SpotGhost ML: Extracted features:', features);
      
      // Calculate weighted sum
      let score = this.weights.bias;
      for (const [feature, value] of Object.entries(features)) {
        if (this.weights[feature] !== undefined) {
          score += this.weights[feature] * value;
        }
      }
      
      // Apply sigmoid function to get probability
      const scamProbability = this.sigmoid(score);
      const confidence = this.calculateConfidence(features, score);
      
      const prediction = {
        scamProbability,
        confidence,
        isScam: scamProbability > 0.5,
        riskLevel: this.getRiskLevel(scamProbability),
        features,
        modelVersion: this.modelVersion,
        analysisMethod: 'Lightweight ML Model'
      };
      
      console.log('SpotGhost ML: Prediction complete:', prediction);
      return prediction;
      
    } catch (error) {
      console.error('SpotGhost ML: Prediction failed:', error);
      return this.createFallbackPrediction(jobData);
    }
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  calculateConfidence(features, score) {
    // Higher confidence when we have more features and stronger signals
    const featureCount = Object.values(features).filter(v => v > 0).length;
    const maxFeatures = Object.keys(features).length;
    
    const featureConfidence = featureCount / maxFeatures;
    const signalStrength = Math.abs(score) / 3; // Normalize score
    
    return Math.min((featureConfidence + signalStrength) / 2, 0.95);
  }

  getRiskLevel(probability) {
    if (probability < 0.15) return 'Very Low Risk';
    if (probability < 0.35) return 'Low Risk';
    if (probability < 0.65) return 'Medium Risk';
    if (probability < 0.85) return 'High Risk';
    return 'Very High Risk';
  }

  createFallbackPrediction(jobData) {
    return {
      scamProbability: 0.3,
      confidence: 0.5,
      isScam: false,
      riskLevel: 'Medium Risk',
      features: {},
      modelVersion: this.modelVersion,
      analysisMethod: 'Fallback Analysis'
    };
  }

  // Train model with new data (simplified version)
  async trainModel(labeledData) {
    if (labeledData.length < 5) {
      throw new Error('Need at least 5 labeled samples to train');
    }

    console.log(`SpotGhost ML: Training with ${labeledData.length} samples`);
    
    try {
      // Simple weight adjustment based on labeled data
      const learningRate = 0.01;
      let improvements = 0;
      
      for (const sample of labeledData) {
        const features = this.extractFeatures(sample.jobData);
        const prediction = await this.predict(sample.jobData);
        const error = (sample.isScam ? 1 : 0) - prediction.scamProbability;
        
        // Adjust weights based on error
        for (const [feature, value] of Object.entries(features)) {
          if (this.weights[feature] !== undefined) {
            const adjustment = learningRate * error * value;
            this.weights[feature] += adjustment;
            if (Math.abs(adjustment) > 0.001) improvements++;
          }
        }
      }
      
      // Save updated weights
      await this.saveModel();
      
      console.log(`SpotGhost ML: Training complete. Made ${improvements} weight adjustments.`);
      
      return {
        success: true,
        samplesProcessed: labeledData.length,
        improvements,
        modelVersion: this.modelVersion
      };
      
    } catch (error) {
      console.error('SpotGhost ML: Training failed:', error);
      throw error;
    }
  }

  // Save model weights to storage
  async saveModel() {
    try {
      const modelData = {
        weights: this.weights,
        version: this.modelVersion,
        savedAt: new Date().toISOString()
      };
      
      await chrome.storage.local.set({ [this.storageKey]: modelData });
      console.log('SpotGhost ML: Model weights saved');
    } catch (error) {
      console.error('SpotGhost ML: Failed to save model:', error);
    }
  }

  // Load model weights from storage
  async loadModel() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const modelData = result[this.storageKey];
      
      if (modelData && modelData.weights) {
        this.weights = { ...this.weights, ...modelData.weights };
        console.log('SpotGhost ML: Loaded saved weights');
      } else {
        console.log('SpotGhost ML: Using default weights');
      }
    } catch (error) {
      console.error('SpotGhost ML: Failed to load model:', error);
    }
  }

  // Get model status
  getStatus() {
    return {
      isReady: this.isReady,
      isTraining: this.isTraining,
      isLoading: this.isLoading,
      modelVersion: this.modelVersion,
      hasModel: true,
      modelType: 'Lightweight Native'
    };
  }
}

// Make the class globally available
window.SpotGhostMLModel = SpotGhostMLModel;

console.log('SpotGhost ML: Lightweight model loaded successfully');