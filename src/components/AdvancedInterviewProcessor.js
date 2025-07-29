import React, { useState, useRef } from 'react';

const AdvancedInterviewProcessor = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [apiStatus, setApiStatus] = useState('disconnected');
  const [processedInsights, setProcessedInsights] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showCsvData, setShowCsvData] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [mlMode, setMlMode] = useState(false);
  const [trainingData, setTrainingData] = useState([]);
  const [modelStats, setModelStats] = useState({ interviews: 0, corrections: 0, accuracy: 0 });
  const fileInputRef = useRef(null);
  const correctionFileRef = useRef(null);

  // Enhanced competency mapping
  const competencyMap = {
    "1001": "Comunicación",
    "1002": "Diferenciación", 
    "1003": "Facilidad para hacer negocios",
    "1004": "Forecasting colaborativo",
    "1005": "Planificación colaborativa de negocios",
    "1006": "Eficiencias en Cadena de Suministro",
    "1007": "Programas de retail media",
    "1008": "Apoya nuestra estrategia",
    "1009": "Indicadores logísticos",
    "1010": "Inversión en trade",
    "1011": "Equipo capacitado y con experiencia",
    "1012": "Alineación interna",
    "1013": "Objetivos de Sostenibilidad", 
    "1014": "Confianza",
    "1015": "Consumer Marketing",
    "1016": "Crecimiento de la categoría",
    "1017": "Cumple compromisos",
    "1018": "Integración de E-Commerce",
    "1019": "Pedidos a tiempo y completos",
    "1020": "Administración de promociones en tiendas físicas",
    "1021": "Surtido",
    "1022": "Shopper marketing", 
    "1023": "Respuesta en servicio al cliente",
    "1024": "Apoyo en tiendas",
    "1025": "Comunicación de órdenes y facturación",
    "1026": "Agilidad al cambio",
    "1027": "Liderazgo digital",
    "1028": "Información valiosa y objetiva",
    "1029": "Innovación de productos",
    "BIC001": "Best in Class"
  };

  const sentimentMap = {
    "SENT001": "Fortaleza",
    "SENT002": "Oportunidad", 
    "SENT003": "Acción Clave"
  };

  // Enhanced supplier codes with aliases
  const supplierCodes = {
    "kraft heinz": { code: "9138", aliases: ["kraft", "heinz", "kraft foods"] },
    "coca-cola": { code: "33", aliases: ["coca cola", "coke", "coca"] },
    "nestle": { code: "5152", aliases: ["nestlé", "nestle foods", "nescafe"] },
    "procter & gamble": { code: "296", aliases: ["p&g", "procter", "gamble", "pg"] },
    "unilever": { code: "71", aliases: ["unilever foods", "dove", "knorr"] },
    "colgate-palmolive": { code: "69", aliases: ["colgate", "palmolive"] },
    "pepsico": { code: "147", aliases: ["pepsi", "pepsi cola", "frito lay"] },
    "mondelez": { code: "8429", aliases: ["oreo", "cadbury", "trident"] },
    "mars": { code: "4521", aliases: ["mars inc", "snickers", "m&m"] },
    "kimberly-clark": { code: "1523", aliases: ["kimberly", "clark", "kleenex", "huggies"] },
    "sc johnson": { code: "2847", aliases: ["johnson", "raid", "glade"] },
    "reckitt": { code: "3691", aliases: ["reckitt benckiser", "lysol", "dettol"] },
    "general mills": { code: "7382", aliases: ["general", "mills", "cheerios"] },
    "kellogg": { code: "5927", aliases: ["kelloggs", "corn flakes", "pringles"] },
    "johnson & johnson": { code: "1847", aliases: ["j&j", "johnson johnson", "band aid"] },
    "bayer": { code: "2953", aliases: ["bayer ag", "aspirin"] },
    "heineken": { code: "4728", aliases: ["heineken beer"] },
    "ab inbev": { code: "3582", aliases: ["anheuser busch", "budweiser", "corona"] },
    "lactalis": { code: "DIST001", aliases: ["lactalis group"] },
    "american foods": { code: "DIST002", aliases: ["american", "american food"] }
  };

  // ML Training Data Storage (in production, this would be a database)
  const [mlTrainingData, setMlTrainingData] = useState({
    transcriptionPatterns: [],
    transformationRules: [],
    businessAreaClassifications: [],
    sentimentAnalysis: [],
    companyMentions: []
  });

  // Test API connection
  const testApiConnection = async () => {
    if (!apiKey) {
      setErrorMessage('Please enter your ElevenLabs API key');
      return;
    }

    setApiStatus('connecting');
    setErrorMessage('');

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setApiStatus('connected');
        setErrorMessage('');
        console.log('✅ API connected successfully');
      } else {
        const errorText = await response.text();
        setApiStatus('error');
        setErrorMessage(`API connection failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      setApiStatus('error');
      setErrorMessage(`Connection error: ${error.message}`);
      console.error('API connection error:', error);
    }
  };

  // Load corrected training data
  const loadTrainingData = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      
      const corrections = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
          const correction = {};
          headers.forEach((header, index) => {
            correction[header] = values[index] || '';
          });
          corrections.push(correction);
        }
      }
      
      // Process corrections to extract learning patterns
      processCorrectionsForML(corrections);
      
      setTrainingData(prev => [...prev, ...corrections]);
      setModelStats(prev => ({
        ...prev,
        interviews: prev.interviews + 1,
        corrections: prev.corrections + corrections.length
      }));
      
      console.log(`✅ Loaded ${corrections.length} corrections for ML training`);
      
    } catch (error) {
      console.error('❌ Error loading training data:', error);
      setErrorMessage(`Failed to load training data: ${error.message}`);
    }
  };

  // Process corrections to extract ML patterns
  const processCorrectionsForML = (corrections) => {
    const newPatterns = {
      transcriptionPatterns: [],
      transformationRules: [],
      businessAreaClassifications: [],
      sentimentAnalysis: [],
      companyMentions: []
    };

    corrections.forEach(correction => {
      // Extract transcription patterns
      if (correction.original_text && correction.corrected_transcription) {
        newPatterns.transcriptionPatterns.push({
          original: correction.original_text,
          corrected: correction.corrected_transcription,
          context: correction.speaker,
          confidence: parseFloat(correction.confidence) || 0.5
        });
      }

      // Extract transformation rules
      if (correction.original_text && correction.corrected_professional_text && correction.speaker === 'Speaker_1') {
        newPatterns.transformationRules.push({
          original: correction.original_text,
          transformed: correction.corrected_professional_text,
          company: correction.respondent_company,
          context: extractTransformationContext(correction.original_text)
        });
      }

      // Extract business area classifications
      if (correction.original_text && correction.corrected_business_area_code) {
        newPatterns.businessAreaClassifications.push({
          text: correction.original_text,
          businessArea: correction.corrected_business_area_code,
          keywords: extractKeywords(correction.original_text),
          confidence: 1.0 // Manual correction = high confidence
        });
      }

      // Extract sentiment analysis
      if (correction.original_text && correction.corrected_sentiment_code) {
        newPatterns.sentimentAnalysis.push({
          text: correction.original_text,
          sentiment: correction.corrected_sentiment_code,
          keywords: extractSentimentKeywords(correction.original_text),
          confidence: 1.0
        });
      }

      // Extract company mentions
      if (correction.original_text && correction.corrected_subject_company_code) {
        newPatterns.companyMentions.push({
          text: correction.original_text,
          company: correction.corrected_subject_company,
          code: correction.corrected_subject_company_code,
          context: correction.original_text.toLowerCase()
        });
      }
    });

    // Merge with existing ML data
    setMlTrainingData(prev => ({
      transcriptionPatterns: [...prev.transcriptionPatterns, ...newPatterns.transcriptionPatterns],
      transformationRules: [...prev.transformationRules, ...newPatterns.transformationRules],
      businessAreaClassifications: [...prev.businessAreaClassifications, ...newPatterns.businessAreaClassifications],
      sentimentAnalysis: [...prev.sentimentAnalysis, ...newPatterns.sentimentAnalysis],
      companyMentions: [...prev.companyMentions, ...newPatterns.companyMentions]
    }));

    console.log('🧠 ML patterns extracted:', {
      transcription: newPatterns.transcriptionPatterns.length,
      transformation: newPatterns.transformationRules.length,
      businessArea: newPatterns.businessAreaClassifications.length,
      sentiment: newPatterns.sentimentAnalysis.length,
      companies: newPatterns.companyMentions.length
    });
  };

  // Helper functions for ML pattern extraction
  const extractTransformationContext = (text) => {
    const contexts = [];
    if (/\byo\b/gi.test(text)) contexts.push('first_person');
    if (/\bnosotros\b/gi.test(text)) contexts.push('plural_first_person');
    if (/\bcreo\b/gi.test(text)) contexts.push('opinion');
    if (/\bpienso\b/gi.test(text)) contexts.push('thought');
    if (/\bsiento\b/gi.test(text)) contexts.push('feeling');
    return contexts;
  };

  const extractKeywords = (text) => {
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 3 && !/\b(el|la|los|las|de|del|en|con|por|para|que|es|son|está|están)\b/.test(word));
  };

  const extractSentimentKeywords = (text) => {
    const positiveWords = text.match(/\b(buen|excelen|positiv|fuerte|eficien|destaca)\w*/gi) || [];
    const negativeWords = text.match(/\b(problem|dificult|complic|falta|malo|deficien)\w*/gi) || [];
    const actionWords = text.match(/\b(necesit|debe|requier|important|urgent|tiene que)\w*/gi) || [];
    
    return {
      positive: positiveWords,
      negative: negativeWords,
      action: actionWords
    };
  };

  // ML-Enhanced Transcription Cleaning
  const cleanTranscriptionWithML = (text) => {
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Apply learned transcription patterns
    mlTrainingData.transcriptionPatterns.forEach(pattern => {
      if (pattern.confidence > 0.7) {
        // Simple pattern matching - in production, use more sophisticated ML
        const similarity = calculateTextSimilarity(cleaned, pattern.original);
        if (similarity > 0.8) {
          console.log(`🧠 Applying learned transcription pattern: "${pattern.original}" → "${pattern.corrected}"`);
          cleaned = cleaned.replace(new RegExp(escapeRegex(pattern.original), 'gi'), pattern.corrected);
        }
      }
    });
    
    return cleaned;
  };

  // ML-Enhanced Professional Transformation
  const transformToProfessionalWithML = (text, speaker, companyName = "la compañía") => {
    // INTERVIEWER (Speaker_0): Keep exactly as spoken for context
    if (speaker === "Speaker_0") {
      console.log(`📝 Preserving interviewer question as-is: "${text.substring(0, 50)}..."`);
      return text.replace(/\s+/g, ' ').trim();
    }
    
    // INTERVIEWEE (Speaker_1): Apply ML-enhanced professional transformation
    console.log(`🧠 ML-Enhanced transformation for: "${text.substring(0, 50)}..."`);
    
    let professional = text;
    
    // Apply learned transformation rules
    const applicableRules = mlTrainingData.transformationRules.filter(rule => {
      const similarity = calculateTextSimilarity(text.toLowerCase(), rule.original.toLowerCase());
      return similarity > 0.6; // Threshold for applying learned rules
    });
    
    if (applicableRules.length > 0) {
      console.log(`🧠 Found ${applicableRules.length} applicable ML transformation rules`);
      
      // Apply the most similar rule
      const bestRule = applicableRules.reduce((best, current) => {
        const bestSim = calculateTextSimilarity(text.toLowerCase(), best.original.toLowerCase());
        const currentSim = calculateTextSimilarity(text.toLowerCase(), current.original.toLowerCase());
        return currentSim > bestSim ? current : best;
      });
      
      console.log(`🧠 Applying best ML rule: "${bestRule.original}" → "${bestRule.transformed}"`);
      
      // Use the learned transformation as a base
      professional = adaptTransformation(text, bestRule.transformed, companyName);
    } else {
      // Fall back to rule-based transformation
      professional = applyRuleBasedTransformation(text, companyName);
    }
    
    return professional;
  };

  // Adapt learned transformation to current context
  const adaptTransformation = (originalText, learnedTransformation, companyName) => {
    let adapted = learnedTransformation;
    
    // Replace company references with current company
    adapted = adapted.replace(/\b(En\s+)?[A-Z][a-zA-Z\s]+\b(?=\s+(considera|tiene|está|trabaja|busca))/g, companyName);
    
    // Ensure proper capitalization
    if (adapted.length > 0) {
      adapted = adapted.charAt(0).toUpperCase() + adapted.slice(1);
    }
    
    // Ensure proper punctuation
    if (adapted.length > 0 && 
        !adapted.endsWith('.') && 
        !adapted.endsWith('?') && 
        !adapted.endsWith('!')) {
      adapted += '.';
    }
    
    return adapted;
  };

  // Rule-based transformation fallback
  const applyRuleBasedTransformation = (text, companyName) => {
    let professional = text
      // Remove filler words
      .replace(/\beh,?\s*/gi, '')
      .replace(/\bmm+,?\s*/gi, '')
      .replace(/\bah+,?\s*/gi, '')
      .replace(/\bbueno,?\s*/gi, '')
      .replace(/\beste,?\s*/gi, '')
      .replace(/\bpues,?\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Transform personal to company perspective
    const transformations = [
      { pattern: /\byo creo que\b/gi, replacement: `En ${companyName} consideramos que` },
      { pattern: /\bcreo que\b/gi, replacement: `${companyName} considera que` },
      { pattern: /\byo pienso que\b/gi, replacement: `En ${companyName} pensamos que` },
      { pattern: /\bpienso que\b/gi, replacement: `${companyName} piensa que` },
      { pattern: /\byo siento que\b/gi, replacement: `En ${companyName} percibimos que` },
      { pattern: /\ben mi opinión\b/gi, replacement: `Desde la perspectiva de ${companyName}` },
      { pattern: /\byo he visto\b/gi, replacement: `${companyName} ha observado` },
      { pattern: /\bhe visto\b/gi, replacement: `${companyName} ha observado` },
      { pattern: /\byo necesito\b/gi, replacement: `${companyName} requiere` },
      { pattern: /\bnecesito\b/gi, replacement: `${companyName} necesita` },
      { pattern: /\bme gustaría\b/gi, replacement: `${companyName} busca` },
      { pattern: /\bnosotros tenemos\b/gi, replacement: `${companyName} tiene` },
      { pattern: /\btenemos\b/gi, replacement: `${companyName} tiene` },
      { pattern: /\bestamos\b/gi, replacement: `${companyName} está` },
      { pattern: /\byo trabajo\b/gi, replacement: `${companyName} trabaja` },
      { pattern: /\byo\b/gi, replacement: companyName },
      { pattern: /\bnosotros\b/gi, replacement: companyName }
    ];
    
    transformations.forEach(({ pattern, replacement }) => {
      professional = professional.replace(pattern, replacement);
    });

    // Improve sentence structure
    professional = professional
      .replace(/\bpero\b/gi, 'sin embargo')
      .replace(/\by también\b/gi, 'además')
      .replace(/\bmuy bueno\b/gi, 'excelente')
      .replace(/\bmuy malo\b/gi, 'deficiente');

    // Ensure proper capitalization and punctuation
    if (professional.length > 0) {
      professional = professional.charAt(0).toUpperCase() + professional.slice(1);
    }
    
    if (professional.length > 0 && 
        !professional.endsWith('.') && 
        !professional.endsWith('?') && 
        !professional.endsWith('!')) {
      professional += '.';
    }
    
    return professional;
  };

  // ML-Enhanced Auto-Tagging
  const autoTagWithML = (text, speaker) => {
    // ALWAYS mark interviewer segments as interviewer
    if (speaker === "Speaker_0") {
      return {
        businessArea: "INTERVIEWER",
        sentiment: "INTERVIEWER",
        isInterviewer: true,
        confidence: 1.0
      };
    }
    
    // For interviewee responses, use ML-enhanced analysis
    const lowerText = text.toLowerCase();
    
    // ML-Enhanced Business Area Detection
    let businessArea = "1006"; // Default
    let businessConfidence = 0.5;
    
    // Check learned patterns first
    const learnedBusinessAreas = mlTrainingData.businessAreaClassifications.filter(pattern => {
      const similarity = calculateTextSimilarity(lowerText, pattern.text.toLowerCase());
      return similarity > 0.6;
    });
    
    if (learnedBusinessAreas.length > 0) {
      const bestMatch = learnedBusinessAreas.reduce((best, current) => {
        const bestSim = calculateTextSimilarity(lowerText, best.text.toLowerCase());
        const currentSim = calculateTextSimilarity(lowerText, current.text.toLowerCase());
        return currentSim > bestSim ? current : best;
      });
      
      businessArea = bestMatch.businessArea;
      businessConfidence = 0.9; // High confidence for learned patterns
      console.log(`🧠 ML Business Area: ${businessArea} (confidence: ${businessConfidence})`);
    } else {
      // Fall back to keyword-based detection
      const businessAreaKeywords = {
        "1001": ["comunicación", "información", "contacto", "diálogo", "transparencia"],
        "1006": ["distribu", "cadena", "logística", "abasto", "inventario", "almacén"],
        "1015": ["marca", "marketing", "publicidad", "consumer"],
        "1019": ["pedido", "entrega", "tiempo", "puntual"],
        "1017": ["compromiso", "cumpl", "promesa"],
        "1018": ["digital", "online", "e-commerce", "ecommerce"],
        "1016": ["crecimiento", "categoría", "ventas"],
        "1014": ["confianza", "confiable", "transparente"],
        "1011": ["equipo", "personal", "experiencia", "capacitado"]
      };
      
      let maxScore = 0;
      Object.entries(businessAreaKeywords).forEach(([code, keywords]) => {
        const score = keywords.reduce((sum, keyword) => 
          sum + (lowerText.includes(keyword) ? 1 : 0), 0);
        if (score > maxScore) {
          maxScore = score;
          businessArea = code;
          businessConfidence = Math.min(0.8, 0.5 + (score * 0.15));
        }
      });
    }
    
    // ML-Enhanced Sentiment Analysis
    let sentiment = "SENT002"; // Default to opportunity
    let sentimentConfidence = 0.5;
    
    // Check learned sentiment patterns
    const learnedSentiments = mlTrainingData.sentimentAnalysis.filter(pattern => {
      const similarity = calculateTextSimilarity(lowerText, pattern.text.toLowerCase());
      return similarity > 0.6;
    });
    
    if (learnedSentiments.length > 0) {
      const bestMatch = learnedSentiments.reduce((best, current) => {
        const bestSim = calculateTextSimilarity(lowerText, best.text.toLowerCase());
        const currentSim = calculateTextSimilarity(lowerText, current.text.toLowerCase());
        return currentSim > bestSim ? current : best;
      });
      
      sentiment = bestMatch.sentiment;
      sentimentConfidence = 0.9;
      console.log(`🧠 ML Sentiment: ${sentiment} (confidence: ${sentimentConfidence})`);
    } else {
      // Fall back to keyword-based sentiment
      const strengthKeywords = ["fuerte", "buen", "excelen", "positiv", "destaca", "reconoc", "eficiente"];
      const keyActionKeywords = ["necesita", "debe", "tiene que", "debería", "requier", "important", "urgente"];
      const opportunityKeywords = ["oportunidad", "mejorar", "problema", "dificulta", "complica", "falta"];
      
      const strengthScore = strengthKeywords.reduce((sum, keyword) => 
        sum + (lowerText.includes(keyword) ? 1 : 0), 0);
      const keyActionScore = keyActionKeywords.reduce((sum, keyword) => 
        sum + (lowerText.includes(keyword) ? 1 : 0), 0);
      const opportunityScore = opportunityKeywords.reduce((sum, keyword) => 
        sum + (lowerText.includes(keyword) ? 1 : 0), 0);
      
      if (keyActionScore > strengthScore && keyActionScore > opportunityScore) {
        sentiment = "SENT003";
        sentimentConfidence = 0.7;
      } else if (strengthScore > opportunityScore && strengthScore > 0) {
        sentiment = "SENT001";
        sentimentConfidence = 0.7;
      }
    }
    
    return {
      businessArea,
      sentiment,
      confidence: Math.min(businessConfidence, sentimentConfidence),
      isInterviewer: false,
      isBestInClass: false
    };
  };

  // Helper functions for ML
  const calculateTextSimilarity = (text1, text2) => {
    // Simple Jaccard similarity - in production, use more sophisticated algorithms
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  };

  const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Calculate model accuracy based on training data
  const calculateModelAccuracy = () => {
    if (trainingData.length === 0) return 0;
    
    // Simple accuracy calculation - in production, use more sophisticated metrics
    const totalCorrections = trainingData.length;
    const significantCorrections = trainingData.filter(item => 
      item.original_text !== item.corrected_professional_text ||
      item.business_area_code !== item.corrected_business_area_code ||
      item.sentiment_code !== item.corrected_sentiment_code
    ).length;
    
    const accuracy = Math.max(0, (totalCorrections - significantCorrections) / totalCorrections * 100);
    
    setModelStats(prev => ({ ...prev, accuracy: Math.round(accuracy) }));
    return accuracy;
  };

  // Rest of the component code remains the same...
  // (Including all the existing functions for transcription, processing, etc.)
  
  // Minimal text cleaning - preserve all content
  const cleanTranscriptionText = (text) => {
    return mlMode ? cleanTranscriptionWithML(text) : text.replace(/\s+/g, ' ').trim();
  };

  // Improved confidence calculation
  const calculateImprovedConfidence = (words) => {
    if (!words || words.length === 0) return 0.5;
    
    const confidences = words.map(word => {
      if (word.logprob !== undefined && word.logprob !== null) {
        return Math.exp(Math.max(word.logprob, -10));
      }
      return 0.7;
    });
    
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    return Math.min(avgConfidence, 1.0);
  };

  // Time formatting
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // [Include all the existing parsing, transcription, and processing functions here...]
  // For brevity, I'm not repeating all the existing functions, but they would remain the same

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">🧠 AI-Enhanced Interview Processor</h1>
        <p className="text-blue-100">Machine Learning powered transcription and transformation</p>
      </div>

      {/* ML Training Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">🧠 Machine Learning Training</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{modelStats.interviews}</div>
            <div className="text-sm text-gray-600">Training Interviews</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{modelStats.corrections}</div>
            <div className="text-sm text-gray-600">Total Corrections</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{modelStats.accuracy}%</div>
            <div className="text-sm text-gray-600">Model Accuracy</div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={mlMode}
              onChange={(e) => setMlMode(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Enable ML-Enhanced Processing</span>
          </label>
          
          <input
            ref={correctionFileRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files[0] && loadTrainingData(e.target.files[0])}
            className="hidden"
          />
          
          <button
            onClick={() => correctionFileRef.current?.click()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            📚 Upload Corrected Data
          </button>
          
          <button
            onClick={calculateModelAccuracy}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            📊 Calculate Accuracy
          </button>
        </div>
        
        {mlMode && (
          <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md">
            <div className="text-green-800 text-sm">
              🧠 ML Mode Active: Using {mlTrainingData.transformationRules.length} transformation rules, 
              {mlTrainingData.businessAreaClassifications.length} business area patterns, and 
              {mlTrainingData.sentimentAnalysis.length} sentiment patterns.
            </div>
          </div>
        )}
      </div>

      {/* Step 1: Setup */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Step 1: Setup & Configuration</h2>
            
            {/* API Key Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ElevenLabs API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your ElevenLabs API key"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={testApiConnection}
                  disabled={!apiKey || apiStatus === 'connecting'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {apiStatus === 'connecting' ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              
              {/* API Status */}
              <div className="mt-2">
                {apiStatus === 'connected' && (
                  <div className="text-green-600 text-sm">✅ API Connected Successfully</div>
                )}
                {apiStatus === 'error' && (
                  <div className="text-red-600 text-sm">❌ Connection Failed</div>
                )}
              </div>
            </div>

            {/* Translation Toggle */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={translationEnabled}
                  onChange={(e) => setTranslationEnabled(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Enable English Translation (requires OpenAI API setup)</span>
              </label>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.mp4,.m4a"
                onChange={(e) => setAudioFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {audioFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {errorMessage}
              </div>
            )}

            {/* Process Button */}
            <button
              onClick={() => {/* processAudioFile function would go here */}}
              disabled={!audioFile || apiStatus !== 'connected' || processing}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {processing ? 'Processing...' : mlMode ? '🧠 Start AI-Enhanced Processing' : '🚀 Start Standard Processing'}
            </button>
          </div>
        </div>
      )}

      {/* Additional steps and components would continue here... */}
    </div>
  );
};

export default AdvancedInterviewProcessor;

