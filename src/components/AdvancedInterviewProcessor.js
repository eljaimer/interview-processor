import React, { useState, useRef, useEffect } from 'react';

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
  const [storageMethod, setStorageMethod] = useState('localStorage');
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

  // ML Training Data with flexible segment handling
  const [mlTrainingData, setMlTrainingData] = useState({
    transcriptionPatterns: [],
    transformationRules: [],
    businessAreaClassifications: [],
    sentimentAnalysis: [],
    companyMentions: [],
    segmentPatterns: [], // NEW: Learn from segment modifications
    lastUpdated: null,
    version: '1.1'
  });

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
    
    // Enhanced sentiment analysis (same as before)
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

  // Enhanced correction processing with flexible segment handling
  const processCorrectionsForMLEnhanced = (corrections) => {
    const newPatterns = {
      transcriptionPatterns: [],
      transformationRules: [],
      businessAreaClassifications: [],
      sentimentAnalysis: [],
      companyMentions: [],
      segmentPatterns: [] // NEW: Track segment modifications
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

  // Helper function for text similarity (same as before)
  const calculateTextSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  };

  // Helper functions (same as before)
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

  // Main processing function (updated to use enhanced tagging)
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
      // [Transcription logic would go here - same as before]
      
      console.log('📝 Processing with enhanced multi-area tagging...');
      setProgress(40);

      const companyInfo = extractCompanyInfoImproved(audioFile.name);
      const insights = [];

      // Simulate processing for demo
      const mockSegments = [
        {
          start_time: "0:00.000",
          end_time: "0:25.000", 
          speaker: "Speaker_0",
          confidence: 0.9,
          text: "¿Sí? Entonces, Hugo, el día de hoy me encantaría platicarle de Kraft Heinz como proveedor"
        }
      ];

      for (const [index, segment] of mockSegments.entries()) {
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
          english_translation: "Translation pending",
          
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
        
        setProgress(40 + (index / mockSegments.length) * 40);
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

  // [Include all other existing functions here...]
  // For brevity, not repeating all the existing functions

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">🧠 Enhanced Interview Processor</h1>
        <p className="text-blue-100">Multiple Business Areas + Flexible Segment Handling</p>
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

      {/* Rest of the component UI remains the same... */}
      {/* (Setup, processing, and results sections) */}
    </div>
  );
};

export default AdvancedInterviewProcessor;

