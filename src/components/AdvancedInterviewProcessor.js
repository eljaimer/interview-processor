import React, { useState, useRef, useEffect } from 'react';

const AdvancedInterviewProcessor = () => {
  // State management
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
  const [storageMethod, setStorageMethod] = useState('localStorage');
  
  // Refs
  const fileInputRef = useRef(null);
  const correctionFileRef = useRef(null);

  // Enhanced competency mapping with priorities for multiple suggestions
  const competencyMap = {
    "1001": { name: "Comunicación", keywords: ["comunicación", "información", "contacto", "diálogo", "transparencia"], priority: 1 },
    "1002": { name: "Diferenciación", keywords: ["diferencia", "único", "distintivo", "especial"], priority: 2 },
    "1003": { name: "Facilidad para hacer negocios", keywords: ["fácil", "simple", "proceso", "trámite"], priority: 2 },
    "1004": { name: "Forecasting colaborativo", keywords: ["pronóstico", "forecast", "predicción", "planificación"], priority: 3 },
    "1005": { name: "Planificación colaborativa de negocios", keywords: ["planificación", "colaborativo", "estrategia"], priority: 2 },
    "1006": { name: "Eficiencias en Cadena de Suministro", keywords: ["distribu", "cadena", "logística", "abasto", "inventario", "almacén"], priority: 1 },
    "1007": { name: "Programas de retail media", keywords: ["retail media", "publicidad", "promoción"], priority: 3 },
    "1008": { name: "Apoya nuestra estrategia", keywords: ["estrategia", "apoyo", "alineación"], priority: 2 },
    "1009": { name: "Indicadores logísticos", keywords: ["indicador", "métrica", "kpi", "medición"], priority: 3 },
    "1010": { name: "Inversión en trade", keywords: ["inversión", "trade", "comercial"], priority: 3 },
    "1011": { name: "Equipo capacitado y con experiencia", keywords: ["equipo", "personal", "experiencia", "capacitado"], priority: 2 },
    "1012": { name: "Alineación interna", keywords: ["alineación", "interno", "coordinación"], priority: 3 },
    "1013": { name: "Objetivos de Sostenibilidad", keywords: ["sostenibilidad", "sustentable", "ambiental"], priority: 3 },
    "1014": { name: "Confianza", keywords: ["confianza", "confiable", "transparente"], priority: 1 },
    "1015": { name: "Consumer Marketing", keywords: ["marca", "marketing", "publicidad", "consumer"], priority: 2 },
    "1016": { name: "Crecimiento de la categoría", keywords: ["crecimiento", "categoría", "ventas"], priority: 1 },
    "1017": { name: "Cumple compromisos", keywords: ["compromiso", "cumpl", "promesa"], priority: 1 },
    "1018": { name: "Integración de E-Commerce", keywords: ["digital", "online", "e-commerce", "ecommerce"], priority: 2 },
    "1019": { name: "Pedidos a tiempo y completos", keywords: ["pedido", "entrega", "tiempo", "puntual"], priority: 1 },
    "1020": { name: "Administración de promociones en tiendas físicas", keywords: ["promoción", "tienda", "física"], priority: 3 },
    "1021": { name: "Surtido", keywords: ["surtido", "variedad", "producto"], priority: 2 },
    "1022": { name: "Shopper marketing", keywords: ["shopper", "comprador", "punto de venta"], priority: 3 },
    "1023": { name: "Respuesta en servicio al cliente", keywords: ["servicio", "cliente", "atención"], priority: 2 },
    "1024": { name: "Apoyo en tiendas", keywords: ["apoyo", "tienda", "soporte"], priority: 3 },
    "1025": { name: "Comunicación de órdenes y facturación", keywords: ["orden", "facturación", "billing"], priority: 3 },
    "1026": { name: "Agilidad al cambio", keywords: ["agilidad", "cambio", "adaptación"], priority: 2 },
    "1027": { name: "Liderazgo digital", keywords: ["liderazgo", "digital", "tecnología"], priority: 2 },
    "1028": { name: "Información valiosa y objetiva", keywords: ["información", "datos", "análisis"], priority: 2 },
    "1029": { name: "Innovación de productos", keywords: ["innovación", "producto", "desarrollo"], priority: 2 },
    "BIC001": { name: "Best in Class", keywords: ["best in class", "mejor práctica", "referente", "líder"], priority: 1 }
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

  // ML Training Data with flexible segment handling
  const [mlTrainingData, setMlTrainingData] = useState({
    transcriptionPatterns: [],
    transformationRules: [],
    businessAreaClassifications: [],
    sentimentAnalysis: [],
    companyMentions: [],
    segmentPatterns: [],
    lastUpdated: null,
    version: '1.1'
  });

  // Load training data on component mount
  useEffect(() => {
    loadPersistedTrainingData();
  }, [storageMethod]);

  // Save training data whenever it changes
  useEffect(() => {
    if (mlTrainingData.transcriptionPatterns.length > 0) {
      saveTrainingDataToPersistentStorage();
    }
  }, [mlTrainingData]);

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

  // Storage functions
  const saveToLocalStorage = async (data) => {
    try {
      const serializedData = JSON.stringify({
        ...data,
        lastUpdated: new Date().toISOString()
      });
      localStorage.setItem('interviewProcessor_mlData', serializedData);
      console.log('✅ Training data saved to localStorage');
      return true;
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
      return false;
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      const data = localStorage.getItem('interviewProcessor_mlData');
      if (data) {
        const parsed = JSON.parse(data);
        console.log('✅ Training data loaded from localStorage');
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error);
      return null;
    }
  };

  const saveTrainingDataToPersistentStorage = async () => {
    let success = false;
    
    switch (storageMethod) {
      case 'localStorage':
        success = await saveToLocalStorage(mlTrainingData);
        break;
      default:
        console.warn('No storage method selected');
    }
    
    return success;
  };

  const loadPersistedTrainingData = async () => {
    let data = null;
    
    switch (storageMethod) {
      case 'localStorage':
        data = await loadFromLocalStorage();
        break;
      default:
        console.warn('No storage method selected');
    }
    
    if (data) {
      setMlTrainingData(data);
      updateModelStats(data);
      console.log(`✅ Training data loaded from ${storageMethod}`);
    } else {
      console.log(`ℹ️ No existing training data found in ${storageMethod}`);
    }
  };

  // Update model statistics
  const updateModelStats = (data) => {
    const totalPatterns = data.transcriptionPatterns.length + 
                         data.transformationRules.length + 
                         data.businessAreaClassifications.length + 
                         data.sentimentAnalysis.length;
    
    setModelStats({
      interviews: Math.ceil(totalPatterns / 10),
      corrections: totalPatterns,
      accuracy: calculateAccuracyFromData(data)
    });
  };

  const calculateAccuracyFromData = (data) => {
    const totalPatterns = data.transcriptionPatterns.length + 
                         data.transformationRules.length + 
                         data.businessAreaClassifications.length;
    
    if (totalPatterns === 0) return 0;
    if (totalPatterns < 10) return 60;
    if (totalPatterns < 50) return 75;
    if (totalPatterns < 100) return 85;
    return 90;
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
      const newPatterns = processCorrectionsForMLEnhanced(corrections);
      
      // Merge with existing ML data
      setMlTrainingData(prev => ({
        transcriptionPatterns: [...prev.transcriptionPatterns, ...newPatterns.transcriptionPatterns],
        transformationRules: [...prev.transformationRules, ...newPatterns.transformationRules],
        businessAreaClassifications: [...prev.businessAreaClassifications, ...newPatterns.businessAreaClassifications],
        sentimentAnalysis: [...prev.sentimentAnalysis, ...newPatterns.sentimentAnalysis],
        companyMentions: [...prev.companyMentions, ...newPatterns.companyMentions],
        segmentPatterns: [...prev.segmentPatterns, ...newPatterns.segmentPatterns],
        lastUpdated: new Date().toISOString(),
        version: '1.1'
      }));
      
      setTrainingData(prev => [...prev, ...corrections]);
      
      console.log(`✅ Loaded ${corrections.length} corrections for ML training`);
      
      // Auto-save to persistent storage
      setTimeout(() => saveTrainingDataToPersistentStorage(), 1000);
      
    } catch (error) {
      console.error('❌ Error loading training data:', error);
      setErrorMessage(`Failed to load training data: ${error.message}`);
    }
  };

  // Enhanced correction processing with flexible segment handling
  const processCorrectionsForMLEnhanced = (corrections) => {
    const newPatterns = {
      transcriptionPatterns: [],
      transformationRules: [],
      businessAreaClassifications: [],
      sentimentAnalysis: [],
      companyMentions: [],
      segmentPatterns: []
    };

    // Group corrections by file to detect segment changes
    const correctionsByFile = {};
    corrections.forEach(correction => {
      const fileName = correction.file_name;
      if (!correctionsByFile[fileName]) {
        correctionsByFile[fileName] = [];
      }
      correctionsByFile[fileName].push(correction);
    });

    // Process each file's corrections
    Object.entries(correctionsByFile).forEach(([fileName, fileCorrections]) => {
      console.log(`🔍 Processing ${fileCorrections.length} corrections for ${fileName}`);
      
      // Detect segment modifications (joins/splits)
      const segmentModifications = detectSegmentModifications(fileCorrections);
      newPatterns.segmentPatterns.push(...segmentModifications);
      
      // Process individual corrections
      fileCorrections.forEach(correction => {
        // Extract transcription patterns
        if (correction.original_text && correction.corrected_transcription) {
          newPatterns.transcriptionPatterns.push({
            original: correction.original_text,
            corrected: correction.corrected_transcription,
            context: correction.speaker,
            confidence: parseFloat(correction.confidence) || 0.5,
            timestamp: new Date().toISOString(),
            fileName: fileName
          });
        }

        // Extract transformation rules
        if (correction.original_text && correction.corrected_professional_text && correction.speaker === 'Speaker_1') {
          newPatterns.transformationRules.push({
            original: correction.original_text,
            transformed: correction.corrected_professional_text,
            company: correction.respondent_company,
            context: extractTransformationContext(correction.original_text),
            timestamp: new Date().toISOString(),
            fileName: fileName
          });
        }

        // Extract business area classifications (including multiple suggestions)
        if (correction.original_text && correction.corrected_business_area_code) {
          newPatterns.businessAreaClassifications.push({
            text: correction.original_text,
            businessArea: correction.corrected_business_area_code,
            suggestedAreas: correction.corrected_suggested_business_areas || correction.corrected_business_area_code,
            keywords: extractKeywords(correction.original_text),
            confidence: 1.0,
            timestamp: new Date().toISOString(),
            fileName: fileName
          });
        }

        // Extract sentiment analysis
        if (correction.original_text && correction.corrected_sentiment_code) {
          newPatterns.sentimentAnalysis.push({
            text: correction.original_text,
            sentiment: correction.corrected_sentiment_code,
            keywords: extractSentimentKeywords(correction.original_text),
            confidence: 1.0,
            timestamp: new Date().toISOString(),
            fileName: fileName
          });
        }

        // Extract company mentions
        if (correction.original_text && correction.corrected_subject_company_code) {
          newPatterns.companyMentions.push({
            text: correction.original_text,
            company: correction.corrected_subject_company,
            code: correction.corrected_subject_company_code,
            context: correction.original_text.toLowerCase(),
            timestamp: new Date().toISOString(),
            fileName: fileName
          });
        }
      });
    });

    console.log('🧠 Enhanced ML patterns extracted:', {
      transcription: newPatterns.transcriptionPatterns.length,
      transformation: newPatterns.transformationRules.length,
      businessArea: newPatterns.businessAreaClassifications.length,
      sentiment: newPatterns.sentimentAnalysis.length,
      companies: newPatterns.companyMentions.length,
      segments: newPatterns.segmentPatterns.length
    });

    return newPatterns;
  };

  // NEW: Detect segment modifications (joins/splits)
  const detectSegmentModifications = (corrections) => {
    const segmentPatterns = [];
    
    // Look for patterns that suggest segment joining or splitting
    corrections.forEach((correction, index) => {
      // Check if this correction represents a joined segment
      if (correction.corrected_original_text && 
          correction.corrected_original_text.length > correction.original_text.length * 1.5) {
        
        segmentPatterns.push({
          type: 'segment_join',
          originalText: correction.original_text,
          correctedText: correction.corrected_original_text,
          context: {
            speaker: correction.speaker,
            timeRange: `${correction.start_time}-${correction.end_time}`,
            businessArea: correction.business_area_code
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if this represents content that should be split
      if (correction.corrected_original_text && 
          correction.corrected_original_text.includes('|SPLIT|')) {
        
        const splitParts = correction.corrected_original_text.split('|SPLIT|');
        segmentPatterns.push({
          type: 'segment_split',
          originalText: correction.original_text,
          splitParts: splitParts,
          context: {
            speaker: correction.speaker,
            timeRange: `${correction.start_time}-${correction.end_time}`,
            businessArea: correction.business_area_code
          },
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return segmentPatterns;
  };

  // Helper functions for ML processing
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

  // Enhanced auto-tagging with multiple business area suggestions
  const autoTagEnhancedMultiple = (text, speaker) => {
    // ALWAYS mark interviewer segments as interviewer
    if (speaker === "Speaker_0") {
      return {
        businessArea: "INTERVIEWER",
        suggestedBusinessAreas: "INTERVIEWER",
        sentiment: "INTERVIEWER",
        isInterviewer: true,
        confidence: 1.0
      };
    }
    
    const lowerText = text.toLowerCase();
    
    // Detect Best in Class first
    const bicKeywords = ["best in class", "mejor práctica", "referente", "líder", "ejemplo", "modelo", "ideal"];
    const isBestInClass = bicKeywords.some(keyword => lowerText.includes(keyword));
    
    if (isBestInClass) {
      return {
        businessArea: "BIC001",
        suggestedBusinessAreas: "BIC001",
        sentiment: "BIC001",
        isBestInClass: true,
        confidence: 0.9
      };
    }
    
    // Calculate scores for all business areas
    const businessAreaScores = [];
    
    Object.entries(competencyMap).forEach(([code, data]) => {
      if (code === "BIC001") return; // Skip BIC, handled above
      
      let score = 0;
      let matchedKeywords = [];
      
      // Check keyword matches
      data.keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      });
      
      // Apply priority weighting (higher priority = slightly higher score)
      const priorityBonus = (4 - data.priority) * 0.1;
      score += priorityBonus;
      
      // Check learned patterns from ML
      const learnedPatterns = mlTrainingData.businessAreaClassifications.filter(pattern => 
        pattern.businessArea === code && 
        calculateTextSimilarity(lowerText, pattern.text.toLowerCase()) > 0.6
      );
      
      if (learnedPatterns.length > 0) {
        score += learnedPatterns.length * 0.5; // Boost from ML learning
      }
      
      if (score > 0) {
        businessAreaScores.push({
          code,
          name: data.name,
          score,
          matchedKeywords,
          confidence: Math.min(0.9, 0.4 + (score * 0.15))
        });
      }
    });
    
    // Sort by score and get top 3
    businessAreaScores.sort((a, b) => b.score - a.score);
    const topAreas = businessAreaScores.slice(0, 3);
    
    // Primary business area (highest score)
    const primaryArea = topAreas.length > 0 ? topAreas[0] : {
      code: "1006", // Default
      name: "Eficiencias en Cadena de Suministro",
      score: 0.5,
      confidence: 0.5
    };
    
    // Suggested business areas (top 3, formatted as "code1:code2:code3")
    const suggestedAreas = topAreas.length > 0 
      ? topAreas.map(area => area.code).join(":")
      : "1006";
    
    // Enhanced sentiment analysis
    let sentiment = "SENT002"; // Default to opportunity
    
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
    } else if (strengthScore > opportunityScore && strengthScore > 0) {
      sentiment = "SENT001";
    }
    
    console.log(`🎯 Business Area Analysis for: "${text.substring(0, 50)}..."`);
    console.log(`Primary: ${primaryArea.code} (${primaryArea.name})`);
    console.log(`Suggested: ${suggestedAreas}`);
    console.log(`Top matches:`, topAreas.map(a => `${a.code}(${a.score.toFixed(1)})`).join(", "));
    
    return {
      businessArea: primaryArea.code,
      suggestedBusinessAreas: suggestedAreas,
      sentiment,
      confidence: primaryArea.confidence,
      isInterviewer: false,
      isBestInClass: false,
      detailedScores: topAreas // For debugging/analysis
    };
  };

  // Helper function for text similarity
  const calculateTextSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  };

  // Enhanced subject company detection
  const detectSubjectCompanyEnhanced = (text) => {
    const lowerText = text.toLowerCase();
    
    for (const [company, data] of Object.entries(supplierCodes)) {
      const allNames = [company, ...data.aliases];
      
      for (const name of allNames) {
        if (lowerText.includes(name.toLowerCase())) {
          return {
            company: formatCompanyName(company),
            code: data.code,
            confidence: 0.8
          };
        }
      }
    }
    
    return {
      company: "Unknown",
      code: "TBD",
      confidence: 0
    };
  };

  const formatCompanyName = (name) => {
    const nameMap = {
      "kraft heinz": "Kraft Heinz",
      "coca-cola": "Coca-Cola",
      "nestle": "Nestlé",
      "procter & gamble": "Procter & Gamble",
      "unilever": "Unilever",
      "colgate-palmolive": "Colgate-Palmolive",
      "pepsico": "PepsiCo",
      "mondelez": "Mondelez",
      "mars": "Mars",
      "kimberly-clark": "Kimberly-Clark",
      "sc johnson": "SC Johnson",
      "reckitt": "Reckitt",
      "general mills": "General Mills",
      "kellogg": "Kellogg",
      "johnson & johnson": "Johnson & Johnson",
      "bayer": "Bayer",
      "heineken": "Heineken",
      "ab inbev": "AB InBev",
      "lactalis": "Lactalis",
      "american foods": "American Foods"
    };
    return nameMap[name] || name;
  };

  // Country detection
  const detectCountriesEnhanced = (text) => {
    const countries = ["Guatemala", "El Salvador", "Honduras", "Costa Rica", "Nicaragua", "Panamá"];
    const lowerText = text.toLowerCase();
    const mentioned = countries.filter(country => 
      lowerText.includes(country.toLowerCase())
    );
    return mentioned.length > 0 ? mentioned : ["Regional"];
  };

  // Enhanced filename parsing
  const extractCompanyInfoImproved = (filename) => {
    console.log('Parsing filename:', filename);
    
    const nameWithoutExt = filename.replace(/\.(mp4|mp3|wav|m4a)$/i, '');
    
    // Try multiple parsing strategies
    let parts = nameWithoutExt.split('_');
    
    // Handle spaces in filename
    if (parts.length < 4) {
      parts = nameWithoutExt.split(/[\s_]+/);
    }
    
    // Extract information with better fallbacks
    const result = {
      region: 'CAM',
      program: 'HO',
      year: '2025',
      interviewee: 'Unknown',
      interviewee_id: 'Unknown',
      company: 'Unknown',
      company_id: 'Unknown',
      program_type: 'Head Office - Retailers assess Suppliers'
    };
    
    // Try to extract from parts
    if (parts.length >= 4) {
      result.interviewee = parts[1] || result.interviewee;
      result.interviewee_id = parts[2] || result.interviewee_id;
      result.company = parts[3] || result.company;
      result.company_id = parts[4] || result.company_id;
    }
    
    // Look for known companies in filename
    const knownCompanies = ['Walmart', 'Coca-Cola', 'Nestlé', 'Kraft', 'P&G'];
    knownCompanies.forEach(company => {
      if (filename.toLowerCase().includes(company.toLowerCase())) {
        result.company = company;
      }
    });
    
    console.log('Extracted info:', result);
    return result;
  };

  // Professional transformation for interviewee responses only
  const transformToProfessionalImproved = (text, speaker, company) => {
    // Only transform interviewee responses (Speaker_1)
    if (speaker === "Speaker_0") {
      // For interviewer, just clean up spacing
      return text.replace(/\s+/g, ' ').trim();
    }

    let transformed = text;
    
    // Apply ML-learned transformation rules if available
    if (mlMode && mlTrainingData.transformationRules.length > 0) {
      const applicableRules = mlTrainingData.transformationRules.filter(rule => 
        calculateTextSimilarity(text.toLowerCase(), rule.original.toLowerCase()) > 0.7
      );
      
      if (applicableRules.length > 0) {
        console.log(`🧠 Applying ${applicableRules.length} ML transformation rules`);
        applicableRules.forEach(rule => {
          // Apply learned transformation patterns
          transformed = applyTransformationRule(transformed, rule);
        });
      }
    }
    
    // Enhanced filler word removal (20+ patterns)
    const fillerPatterns = [
      /\b(eh|ah|um|mm|hmm|este|esto|pues|bueno|o sea|como que|digamos|verdad|no sé|sabes|entonces|así|como|tipo)\b/gi,
      /\b(y y|que que|es es|la la|el el|de de|en en|con con|por por|para para)\b/gi,
      /\b(ehhh|ahhh|ummm|mmmm|eeee|aaaa)\b/gi,
      /\s*\.\.\.\s*/g,
      /\s*,\s*,\s*/g,
      /\s{2,}/g
    ];
    
    fillerPatterns.forEach(pattern => {
      transformed = transformed.replace(pattern, ' ');
    });
    
    // Context-aware transformations based on business context
    const businessTransformations = [
      // First person to company perspective
      { pattern: /\byo creo que\b/gi, replacement: `${company} considera que` },
      { pattern: /\byo pienso que\b/gi, replacement: `${company} evalúa que` },
      { pattern: /\bnosotros creemos\b/gi, replacement: `${company} considera` },
      { pattern: /\bnosotros pensamos\b/gi, replacement: `${company} evalúa` },
      { pattern: /\ben mi opinión\b/gi, replacement: `Desde la perspectiva de ${company}` },
      { pattern: /\byo diría que\b/gi, replacement: `${company} indica que` },
      
      // Professional language upgrades
      { pattern: /\bbueno\b/gi, replacement: 'satisfactorio' },
      { pattern: /\bmuy bueno\b/gi, replacement: 'excelente' },
      { pattern: /\bmalo\b/gi, replacement: 'deficiente' },
      { pattern: /\bmuy malo\b/gi, replacement: 'crítico' },
      { pattern: /\bproblemas\b/gi, replacement: 'oportunidades de mejora' },
      { pattern: /\bno funciona\b/gi, replacement: 'requiere optimización' },
      
      // Business terminology
      { pattern: /\bvendedores\b/gi, replacement: 'equipo comercial' },
      { pattern: /\bclientes\b/gi, replacement: 'socios comerciales' },
      { pattern: /\bcomprar\b/gi, replacement: 'adquirir' },
      { pattern: /\bvender\b/gi, replacement: 'comercializar' },
      { pattern: /\bdinero\b/gi, replacement: 'inversión' },
      { pattern: /\bcaro\b/gi, replacement: 'de alto valor' },
      { pattern: /\bbarato\b/gi, replacement: 'competitivo en precio' }
    ];
    
    // Apply business transformations
    businessTransformations.forEach(({ pattern, replacement }) => {
      transformed = transformed.replace(pattern, replacement);
    });
    
    // Natural language variations to avoid repetitive phrasing
    const variations = [
      { pattern: /\b${company} considera que\b/gi, alternatives: [`${company} evalúa que`, `En ${company} se considera que`, `${company} determina que`] },
      { pattern: /\bexcelente\b/gi, alternatives: ['sobresaliente', 'destacado', 'superior'] },
      { pattern: /\boportunidades de mejora\b/gi, alternatives: ['áreas de desarrollo', 'aspectos a optimizar', 'puntos de mejora'] }
    ];
    
    // Apply variations randomly to avoid repetition
    variations.forEach(({ pattern, alternatives }) => {
      if (pattern.test(transformed)) {
        const randomAlternative = alternatives[Math.floor(Math.random() * alternatives.length)];
        transformed = transformed.replace(pattern, randomAlternative);
      }
    });
    
    // Grammar and sentence structure improvements
    transformed = transformed
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\.\s*/g, '. ')
      .replace(/\s*;\s*/g, '; ')
      .replace(/\s*:\s*/g, ': ')
      .trim();
    
    // Capitalize first letter and ensure proper sentence ending
    if (transformed.length > 0) {
      transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
      if (!/[.!?]$/.test(transformed)) {
        transformed += '.';
      }
    }
    
    console.log(`🔄 Professional transformation applied (${speaker}):`, {
      original: text.substring(0, 50) + '...',
      transformed: transformed.substring(0, 50) + '...',
      company: company
    });
    
    return transformed;
  };

  // Apply ML transformation rule
  const applyTransformationRule = (text, rule) => {
    // Simple pattern matching and replacement based on learned rules
    const similarity = calculateTextSimilarity(text.toLowerCase(), rule.original.toLowerCase());
    
    if (similarity > 0.8) {
      // High similarity - apply direct transformation
      return rule.transformed;
    } else if (similarity > 0.6) {
      // Partial similarity - apply key transformations
      const keyTransformations = extractKeyTransformations(rule);
      let result = text;
      
      keyTransformations.forEach(({ from, to }) => {
        const regex = new RegExp(from, 'gi');
        result = result.replace(regex, to);
      });
      
      return result;
    }
    
    return text;
  };

  // Extract key transformations from ML rule
  const extractKeyTransformations = (rule) => {
    const transformations = [];
    
    // Common transformation patterns
    const patterns = [
      { from: 'yo creo', to: `${rule.company} considera` },
      { from: 'yo pienso', to: `${rule.company} evalúa` },
      { from: 'bueno', to: 'satisfactorio' },
      { from: 'malo', to: 'deficiente' },
      { from: 'problemas', to: 'oportunidades de mejora' }
    ];
    
    patterns.forEach(pattern => {
      if (rule.original.toLowerCase().includes(pattern.from) && 
          rule.transformed.toLowerCase().includes(pattern.to)) {
        transformations.push(pattern);
      }
    });
    
    return transformations;
  };

  // ACTUAL ELEVENLABS TRANSCRIPTION FUNCTION (restored from our previous work)
  const transcribeWithElevenLabsEnhanced = async (audioFile) => {
    console.log('🎙️ Starting enhanced ElevenLabs transcription...');
    
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('model_id', 'eleven_multilingual_v2');
      formData.append('language_code', 'es');
      formData.append('response_format', 'verbose_json');
      formData.append('enable_speaker_diarization', 'true');
      formData.append('num_speakers', '2');
      
      // Enhanced parameters for better accuracy
      formData.append('stability', '0.5');
      formData.append('similarity_boost', '0.8');
      formData.append('style', '0.2');
      formData.append('use_speaker_boost', 'true');

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ ElevenLabs transcription completed:', result);

      // Enhanced processing of transcription results
      return processTranscriptionResultsEnhanced(result);

    } catch (error) {
      console.error('❌ ElevenLabs transcription error:', error);
      throw error;
    }
  };

  // Enhanced transcription results processing (restored from our previous work)
  const processTranscriptionResultsEnhanced = (result) => {
    console.log('📝 Processing enhanced transcription results...');
    
    if (!result.words || !Array.isArray(result.words)) {
      console.warn('⚠️ No words array found in transcription result');
      return [];
    }

    const words = result.words;
    console.log(`📊 Processing ${words.length} words from transcription`);

    // Much more conservative segmentation for natural conversation flow
    const segments = [];
    let currentSegment = {
      words: [],
      speaker: null,
      start_time: null,
      end_time: null
    };

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Skip words without proper timing or text
      if (!word.start || !word.end || !word.word || word.word.trim() === '') {
        continue;
      }

      // Determine speaker (with better fallback)
      const speaker = word.speaker !== undefined ? `Speaker_${word.speaker}` : 
                    (currentSegment.speaker || 'Speaker_0');

      // Initialize segment if empty
      if (currentSegment.words.length === 0) {
        currentSegment.speaker = speaker;
        currentSegment.start_time = word.start;
      }

      // Check for segment break conditions (MUCH more conservative)
      const shouldBreak = checkSegmentBreakEnhanced(currentSegment, word, words, i);

      if (shouldBreak && currentSegment.words.length > 0) {
        // Finalize current segment
        currentSegment.end_time = currentSegment.words[currentSegment.words.length - 1].end;
        segments.push(createSegmentFromWords(currentSegment));
        
        // Start new segment
        currentSegment = {
          words: [word],
          speaker: speaker,
          start_time: word.start,
          end_time: null
        };
      } else {
        // Add word to current segment
        currentSegment.words.push(word);
        currentSegment.end_time = word.end;
      }
    }

    // Add final segment
    if (currentSegment.words.length > 0) {
      currentSegment.end_time = currentSegment.words[currentSegment.words.length - 1].end;
      segments.push(createSegmentFromWords(currentSegment));
    }

    console.log(`✅ Created ${segments.length} enhanced segments with natural conversation flow`);
    
    // Log segment details for debugging
    segments.forEach((segment, index) => {
      console.log(`Segment ${index + 1}: ${segment.start_time} - ${segment.end_time} (${segment.speaker}) - ${segment.text.substring(0, 50)}...`);
    });

    return segments;
  };

  // Enhanced segment break detection (much more conservative)
  const checkSegmentBreakEnhanced = (currentSegment, word, allWords, index) => {
    const speaker = word.speaker !== undefined ? `Speaker_${word.speaker}` : currentSegment.speaker;
    
    // 1. ONLY break on confirmed, sustained speaker changes
    if (speaker !== currentSegment.speaker) {
      // Look ahead to confirm this is a real speaker change (not just a blip)
      const lookAheadWords = 5;
      let confirmedSpeakerChange = true;
      
      for (let j = index + 1; j < Math.min(index + lookAheadWords, allWords.length); j++) {
        const nextWord = allWords[j];
        const nextSpeaker = nextWord.speaker !== undefined ? `Speaker_${nextWord.speaker}` : currentSegment.speaker;
        
        if (nextSpeaker === currentSegment.speaker) {
          confirmedSpeakerChange = false;
          break;
        }
      }
      
      if (confirmedSpeakerChange) {
        console.log(`🔄 Confirmed speaker change: ${currentSegment.speaker} → ${speaker} at ${word.start}`);
        return true;
      }
    }

    // 2. Very long pauses (8+ seconds) - only for natural conversation breaks
    if (currentSegment.words.length > 0) {
      const lastWord = currentSegment.words[currentSegment.words.length - 1];
      const timeSinceLastWord = word.start - lastWord.end;
      
      if (timeSinceLastWord > 8.0) {
        console.log(`⏸️ Long pause detected: ${timeSinceLastWord.toFixed(2)}s at ${word.start}`);
        return true;
      }
    }

    // 3. Maximum segment duration (60 seconds) - only if at natural break
    if (currentSegment.words.length > 0) {
      const segmentDuration = word.end - currentSegment.start_time;
      
      if (segmentDuration > 60.0) {
        // Only break if we're at a natural pause (2+ seconds)
        const lastWord = currentSegment.words[currentSegment.words.length - 1];
        const timeSinceLastWord = word.start - lastWord.end;
        
        if (timeSinceLastWord > 2.0) {
          console.log(`⏱️ Max duration reached with natural break: ${segmentDuration.toFixed(2)}s at ${word.start}`);
          return true;
        }
      }
    }

    // 4. Target duration (25 seconds) with natural break and complete thought
    if (currentSegment.words.length > 0) {
      const segmentDuration = word.end - currentSegment.start_time;
      
      if (segmentDuration > 25.0) {
        const lastWord = currentSegment.words[currentSegment.words.length - 1];
        const timeSinceLastWord = word.start - lastWord.end;
        
        // Check for natural break (small pause) and complete thought
        if (timeSinceLastWord > 1.0 && isCompleteThought(currentSegment.words)) {
          console.log(`🎯 Target duration with complete thought: ${segmentDuration.toFixed(2)}s at ${word.start}`);
          return true;
        }
      }
    }

    return false;
  };

  // Check if current segment represents a complete thought
  const isCompleteThought = (words) => {
    if (words.length < 5) return false; // Too short to be complete
    
    const text = words.map(w => w.word).join(' ').toLowerCase();
    
    // Look for sentence-ending patterns
    const sentenceEnders = ['.', '?', '!', 'verdad', 'sí', 'no', 'entonces', 'bueno'];
    const hasEnder = sentenceEnders.some(ender => text.includes(ender));
    
    // Look for complete question or statement patterns
    const questionStarters = ['qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'para qué'];
    const statementStarters = ['yo', 'nosotros', 'ellos', 'la empresa', 'el proveedor'];
    
    const hasCompletePattern = questionStarters.some(starter => text.includes(starter)) ||
                              statementStarters.some(starter => text.includes(starter));
    
    return hasEnder || hasCompletePattern;
  };

  // Create segment from words array
  const createSegmentFromWords = (segmentData) => {
    const words = segmentData.words;
    
    // Combine words into text
    let text = words.map(word => word.word).join(' ');
    
    // Enhanced text cleaning to remove artifacts
    text = cleanTranscriptionTextEnhanced(text);
    
    // Calculate confidence from logprob values
    const confidence = calculateSegmentConfidenceEnhanced(words);
    
    // Format timestamps
    const startTime = formatTimestamp(segmentData.start_time);
    const endTime = formatTimestamp(segmentData.end_time);
    
    const segment = {
      start_time: startTime,
      end_time: endTime,
      speaker: segmentData.speaker,
      confidence: confidence,
      text: text,
      word_count: words.length,
      duration: segmentData.end_time - segmentData.start_time
    };
    
    console.log(`📝 Created segment: ${startTime}-${endTime} (${segmentData.speaker}) ${words.length} words, conf: ${confidence.toFixed(2)}`);
    
    return segment;
  };

  // Enhanced text cleaning to remove transcription artifacts
  const cleanTranscriptionTextEnhanced = (text) => {
    let cleaned = text;
    
    // Remove filename artifacts that sometimes appear in transcription
    cleaned = cleaned.replace(/\b(CAM|HO|2025|Hugo|Mejía|Walmart|R105|mp4|mp3|wav|m4a)\b/gi, '');
    
    // Remove excessive spacing and punctuation artifacts
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    cleaned = cleaned.replace(/[,]{2,}/g, ',');
    cleaned = cleaned.replace(/[.]{2,}/g, '.');
    cleaned = cleaned.replace(/\s*,\s*/g, ', ');
    cleaned = cleaned.replace(/\s*\.\s*/g, '. ');
    
    // Remove standalone numbers that are likely artifacts
    cleaned = cleaned.replace(/\b\d{1,4}\b/g, '');
    
    // Remove common transcription artifacts
    cleaned = cleaned.replace(/\b(uh|um|ah|eh)\b/gi, '');
    
    // Clean up spacing again
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    
    return cleaned;
  };

  // Enhanced confidence calculation using logprob values
  const calculateSegmentConfidenceEnhanced = (words) => {
    if (!words || words.length === 0) return 0.5;
    
    // Use logprob values if available (ElevenLabs provides these)
    const logprobValues = words
      .filter(word => word.logprob !== undefined && word.logprob !== null)
      .map(word => word.logprob);
    
    if (logprobValues.length > 0) {
      // Convert logprob to confidence (logprob is typically negative)
      const avgLogprob = logprobValues.reduce((sum, val) => sum + val, 0) / logprobValues.length;
      
      // Convert to 0-1 confidence scale (logprob of 0 = 100% confidence, -10 = ~0% confidence)
      const confidence = Math.max(0, Math.min(1, (avgLogprob + 10) / 10));
      
      return confidence;
    }
    
    // Fallback: estimate confidence based on word characteristics
    let confidenceScore = 0.7; // Base confidence
    
    // Adjust based on word length (longer words typically more confident)
    const avgWordLength = words.reduce((sum, word) => sum + word.word.length, 0) / words.length;
    if (avgWordLength > 5) confidenceScore += 0.1;
    if (avgWordLength < 3) confidenceScore -= 0.1;
    
    // Adjust based on segment length (very short or very long segments less confident)
    if (words.length < 3) confidenceScore -= 0.2;
    if (words.length > 50) confidenceScore -= 0.1;
    
    return Math.max(0.1, Math.min(0.95, confidenceScore));
  };

  // Format timestamp to MM:SS.mmm format
  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
  };

  // MAIN PROCESSING FUNCTION (restored with all our improvements)
  const processAudioFileEnhanced = async () => {
    if (!audioFile || !apiKey || apiStatus !== 'connected') {
      setErrorMessage('Please select file, enter API key, and test connection first');
      return;
    }

    setProcessing(true);
    setStep(2);
    setProgress(0);
    setErrorMessage('');

    try {
      console.log('🎙️ Starting enhanced transcription with multiple business areas...');
      setProgress(10);

      // ACTUAL TRANSCRIPTION (not mock!)
      const transcriptionSegments = await transcribeWithElevenLabsEnhanced(audioFile);
      setProgress(40);

      console.log('📝 Processing with enhanced multi-area tagging...');
      setProgress(50);

      const companyInfo = extractCompanyInfoImproved(audioFile.name);
      const insights = [];

      for (const [index, segment] of transcriptionSegments.entries()) {
        // Use enhanced tagging with multiple business areas
        const tags = autoTagEnhancedMultiple(segment.text, segment.speaker);
        
        const professionalText = transformToProfessionalImproved(
          segment.text, 
          segment.speaker, 
          companyInfo.company
        );
        
        const countries = detectCountriesEnhanced(segment.text);
        const subjectCompanyResult = detectSubjectCompanyEnhanced(segment.text);
        
        insights.push({
          file_name: audioFile.name,
          start_time: segment.start_time,
          end_time: segment.end_time,
          speaker: segment.speaker,
          confidence: segment.confidence,
          original_text: segment.text,
          professional_text: professionalText,
          english_translation: translationEnabled ? "Translation pending" : "Not enabled",
          
          // Respondent Information
          respondent_company: companyInfo.company,
          respondent_company_code: companyInfo.company_id,
          
          // Subject Information
          subject_company_code: tags.isBestInClass ? "BIC001" : subjectCompanyResult.code,
          subject_company: tags.isBestInClass ? "N/A - Best in Class" : subjectCompanyResult.company,
          
          // Enhanced Analysis Results
          business_area_code: tags.businessArea,
          business_area: tags.isBestInClass ? "Best in Class" : competencyMap[tags.businessArea]?.name,
          suggested_business_areas: tags.suggestedBusinessAreas, // NEW
          sentiment_code: tags.sentiment,
          sentiment: tags.isBestInClass ? "Best in Class" : sentimentMap[tags.sentiment],
          
          // Additional fields
          country_specific: countries.length > 1 || !countries.includes("Regional") ? "Country-specific" : "Regional",
          countries: countries.join("; "),
          is_best_in_class: tags.isBestInClass ? "Yes" : "No",
          needs_review: segment.confidence < 0.7 ? "Yes" : "No",
          interviewer_type: "Retailer",
          processing_date: new Date().toISOString().split('T')[0],
          confidence_level: segment.confidence >= 0.8 ? "High" : segment.confidence >= 0.6 ? "Medium" : "Low"
        });
        
        setProgress(50 + (index / transcriptionSegments.length) * 40);
      }

      setProcessedInsights(insights);
      setProgress(90);

      console.log('📊 Generating enhanced CSV with multiple business areas...');
      generateCsvContentEnhanced(insights);
      setProgress(100);
      setStep(3);

    } catch (error) {
      console.error('❌ Processing error:', error);
      setErrorMessage(`Processing failed: ${error.message}`);
      setProcessing(false);
      setStep(1);
    }
  };

  // Enhanced CSV generation with multiple business areas
  const generateCsvContentEnhanced = (insights) => {
    const headers = [
      'file_name', 'start_time', 'end_time', 'speaker', 'confidence',
      'original_text', 'professional_text', 'english_translation',
      'respondent_company', 'respondent_company_code', 'subject_company_code',
      'subject_company', 'business_area_code', 'business_area',
      'suggested_business_areas', 'suggested_business_area_names', // NEW COLUMNS
      'sentiment_code', 'sentiment', 'country_specific', 'countries',
      'is_best_in_class', 'needs_review', 'interviewer_type',
      'processing_date', 'confidence_level'
    ];
    
    const csvRows = [headers.join(',')];
    
    insights.forEach(insight => {
      // Generate suggested business area names
      const suggestedCodes = insight.suggested_business_areas.split(':');
      const suggestedNames = suggestedCodes.map(code => 
        competencyMap[code]?.name || code
      ).join(' : ');
      
      const row = headers.map(header => {
        let value = '';
        
        if (header === 'suggested_business_area_names') {
          value = suggestedNames;
        } else {
          value = insight[header] || '';
        }
        
        // Escape commas and quotes in CSV
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });
    
    setCsvContent(csvRows.join('\n'));
    setProcessing(false);
  };

  // Download CSV
  const downloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `interview_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Reset function
  const resetProcessor = () => {
    setAudioFile(null);
    setProcessing(false);
    setStep(1);
    setProcessedInsights([]);
    setProgress(0);
    setShowCsvData(false);
    setCsvContent('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">🧠 Enhanced Interview Processor</h1>
        <p className="text-blue-100">Multiple Business Areas + Flexible Segment Handling + REAL Transcription</p>
      </div>

      {/* Enhanced Features Info */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">🆕 New Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-green-600 mb-2">📊 Multiple Business Areas</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Primary business area (highest confidence)</li>
              <li>• Up to 3 suggested areas (code1:code2:code3)</li>
              <li>• Balanced reporting across all practices</li>
              <li>• Prevents overuse of common areas</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-blue-600 mb-2">🔧 Flexible Segment Handling</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Join segments: Combine text in corrected CSV</li>
              <li>• Split segments: Use |SPLIT| marker</li>
              <li>• ML learns from your segment preferences</li>
              <li>• No need for exact timestamps</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Segment Correction Guide */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Segment Correction Tips</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <div><strong>To Join Segments:</strong> Simply combine the text in the corrected_original_text field</div>
          <div><strong>To Split Segments:</strong> Use |SPLIT| marker where you want to break: "First part |SPLIT| Second part"</div>
          <div><strong>ML Learning:</strong> The system learns your segmentation preferences automatically</div>
        </div>
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

        <div className="flex gap-4 items-center flex-wrap">
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
            📚 Upload Corrected CSV
          </button>
        </div>
        
        {mlMode && (
          <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md">
            <div className="text-green-800 text-sm">
              🧠 ML Mode Active: Using {mlTrainingData.transformationRules.length} transformation rules, 
              {mlTrainingData.businessAreaClassifications.length} business area patterns, and 
              {mlTrainingData.sentimentAnalysis.length} sentiment patterns.
              {mlTrainingData.lastUpdated && (
                <div className="mt-1">Last updated: {new Date(mlTrainingData.lastUpdated).toLocaleString()}</div>
              )}
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
              onClick={processAudioFileEnhanced}
              disabled={!audioFile || apiStatus !== 'connected' || processing}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {processing ? 'Processing...' : mlMode ? '🧠 Start AI-Enhanced Processing' : '🚀 Start Enhanced Processing'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Step 2: Processing Audio</h2>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Processing with enhanced features...
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Step 3: Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{processedInsights.length}</div>
                <div className="text-sm text-gray-600">Total Segments</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {processedInsights.filter(i => i.speaker === 'Speaker_0').length}
                </div>
                <div className="text-sm text-gray-600">Interviewer</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {processedInsights.filter(i => i.speaker === 'Speaker_1').length}
                </div>
                <div className="text-sm text-gray-600">Interviewee</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">
                  {processedInsights.filter(i => i.needs_review === 'Yes').length}
                </div>
                <div className="text-sm text-gray-600">Need Review</div>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={downloadCsv}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                📥 Download Enhanced CSV
              </button>
              <button
                onClick={() => setShowCsvData(!showCsvData)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showCsvData ? 'Hide' : 'Show'} CSV Data
              </button>
              <button
                onClick={resetProcessor}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                🔄 Process Another File
              </button>
            </div>

            {/* CSV Data Preview */}
            {showCsvData && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Enhanced CSV Data Preview</h3>
                <div className="overflow-x-auto">
                  <pre className="text-xs bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
                    {csvContent.substring(0, 2000)}
                    {csvContent.length > 2000 && '\n... (truncated for display)'}
                  </pre>
                </div>
              </div>
            )}

            {/* Sample Results */}
            {processedInsights.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Sample Enhanced Results</h3>
                <div className="space-y-4">
                  {processedInsights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="text-sm text-gray-600 mb-1">
                        {insight.start_time} - {insight.end_time} | {insight.speaker} | Confidence: {insight.confidence_level}
                      </div>
                      <div className="text-sm mb-2">
                        <strong>Text:</strong> {insight.original_text}
                      </div>
                      <div className="text-sm mb-2">
                        <strong>Primary Area:</strong> {insight.business_area} ({insight.business_area_code})
                      </div>
                      <div className="text-sm mb-2">
                        <strong>Suggested Areas:</strong> {insight.suggested_business_areas}
                      </div>
                      <div className="text-xs text-gray-500">
                        Sentiment: {insight.sentiment} | Subject: {insight.subject_company}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedInterviewProcessor;

