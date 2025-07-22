// Dynamic fraud pattern learning system
export class FraudPatternLearner {
  constructor() {
    this.knownScamPatterns = new Map();
    this.legitimatePatterns = new Map();
    this.loadPatterns();
  }

  // Load existing patterns from database or file
  loadPatterns() {
    // Critical scam patterns with confidence scores
    const criticalPatterns = [
      { pattern: /pay.*\$\d+.*training/i, weight: 0.9, type: 'advance-fee' },
      { pattern: /earn.*\$\d{3,}.*day.*home/i, weight: 0.85, type: 'unrealistic-income' },
      { pattern: /western union|money.*transfer|wire.*transfer/i, weight: 0.95, type: 'money-transfer' },
      { pattern: /no.*experience.*required.*\$\d{3,}/i, weight: 0.8, type: 'unrealistic-offer' },
      { pattern: /urgent.*hiring.*immediate.*start/i, weight: 0.7, type: 'pressure-tactic' },
      { pattern: /processing.*fee|activation.*fee|startup.*fee/i, weight: 0.9, type: 'advance-fee' },
      { pattern: /work.*from.*home.*no.*selling.*\$\d{3,}/i, weight: 0.85, type: 'too-good-to-be-true' }
    ];

    criticalPatterns.forEach(p => {
      this.knownScamPatterns.set(p.pattern.source, p);
    });

    // Legitimate job patterns
    const legitPatterns = [
      { pattern: /bachelor.*degree.*required/i, weight: 0.8, type: 'education-requirement' },
      { pattern: /\d+.*years.*experience.*required/i, weight: 0.85, type: 'experience-requirement' },
      { pattern: /competitive.*salary.*based.*on.*experience/i, weight: 0.7, type: 'realistic-compensation' },
      { pattern: /equal.*opportunity.*employer/i, weight: 0.6, type: 'professional-language' }
    ];

    legitPatterns.forEach(p => {
      this.legitimatePatterns.set(p.pattern.source, p);
    });
  }

  // Analyze text for fraud patterns
  analyzeText(text) {
    const results = {
      scamScore: 0,
      legitimacyScore: 0,
      matchedPatterns: [],
      confidence: 0
    };

    const normalizedText = text.toLowerCase();

    // Check against scam patterns
    for (const [patternStr, patternData] of this.knownScamPatterns) {
      const regex = new RegExp(patternStr, 'i');
      if (regex.test(normalizedText)) {
        results.scamScore += patternData.weight;
        results.matchedPatterns.push({
          type: 'scam',
          pattern: patternData.type,
          weight: patternData.weight
        });
      }
    }

    // Check against legitimate patterns
    for (const [patternStr, patternData] of this.legitimatePatterns) {
      const regex = new RegExp(patternStr, 'i');
      if (regex.test(normalizedText)) {
        results.legitimacyScore += patternData.weight;
        results.matchedPatterns.push({
          type: 'legitimate',
          pattern: patternData.type,
          weight: patternData.weight
        });
      }
    }

    // Calculate confidence based on pattern matches
    results.confidence = Math.min(100, (results.matchedPatterns.length * 15) + 40);

    return results;
  }

  // Learn from new data (for future implementation)
  learnFromFeedback(jobData, actualFraudStatus, userFeedback) {
    // This would update patterns based on user feedback
    // Implementation would depend on your feedback collection system
    console.log('Learning from feedback:', { actualFraudStatus, userFeedback });
  }

  // Get pattern statistics
  getPatternStats() {
    return {
      totalScamPatterns: this.knownScamPatterns.size,
      totalLegitPatterns: this.legitimatePatterns.size,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const fraudPatternLearner = new FraudPatternLearner();

// Enhanced rule-based analysis with pattern learning
export function enhancedRuleBasedAnalysis(jobData) {
  const learner = new FraudPatternLearner();
  const fullText = `${jobData.title} ${jobData.description} ${jobData.company} ${jobData.salary}`;
  
  const patternAnalysis = learner.analyzeText(fullText);
  
  // Convert pattern analysis to standard format
  const warnings = [];
  const redFlags = [];
  const legitimacyIndicators = [];
  
  patternAnalysis.matchedPatterns.forEach(match => {
    if (match.type === 'scam') {
      if (match.weight > 0.8) {
        redFlags.push(`Critical scam pattern detected: ${match.pattern.replace('-', ' ')}`);
      } else {
        warnings.push(`⚠️ Suspicious pattern: ${match.pattern.replace('-', ' ')}`);
      }
    } else {
      legitimacyIndicators.push(`Professional indicator: ${match.pattern.replace('-', ' ')}`);
    }
  });
  
  // Calculate risk score
  const riskScore = Math.min(100, Math.max(0, (patternAnalysis.scamScore * 20) - (patternAnalysis.legitimacyScore * 10)));
  const safetyScore = Math.max(0, 100 - riskScore);
  
  // Determine risk level
  let riskLevel;
  if (safetyScore >= 80) riskLevel = 'Very Low';
  else if (safetyScore >= 65) riskLevel = 'Low';
  else if (safetyScore >= 50) riskLevel = 'Medium';
  else if (safetyScore >= 35) riskLevel = 'High';
  else riskLevel = 'Critical';
  
  return {
    safetyScore,
    riskScore,
    riskLevel,
    warnings,
    redFlags,
    legitimacyIndicators,
    confidenceScore: patternAnalysis.confidence,
    reasoning: `Pattern-based analysis detected ${patternAnalysis.matchedPatterns.length} relevant patterns`,
    scamType: riskScore > 70 ? 'pattern-detected-fraud' : 'none',
    patternStats: learner.getPatternStats(),
    aiAnalysis: false
  };
}