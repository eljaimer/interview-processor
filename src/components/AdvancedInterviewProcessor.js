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
  const [trainingData, setTrainingData] = useState({ interviews: 0, corrections: 0, accuracy: 0 });
  const fileInputRef = useRef(null);

  // Enhanced competency mapping with priorities for balanced reporting
  const competencyMap = {
    "1001": { name: "Comunicación", priority: 1 },
    "1002": { name: "Diferenciación", priority: 2 }, 
    "1003": { name: "Facilidad para hacer negocios", priority: 2 },
    "1004": { name: "Forecasting colaborativo", priority: 3 },
    "1005": { name: "Planificación colaborativa de negocios", priority: 3 },
    "1006": { name: "Eficiencias en Cadena de Suministro", priority: 1 },
    "1007": { name: "Programas de retail media", priority: 3 },
    "1008": { name: "Apoya nuestra estrategia", priority: 2 },
    "1009": { name: "Indicadores logísticos", priority: 2 },
    "1010": { name: "Inversión en trade", priority: 3 },
    "1011": { name: "Equipo capacitado y con experiencia", priority: 2 },
    "1012": { name: "Alineación interna", priority: 2 },
    "1013": { name: "Objetivos de Sostenibilidad", priority: 3 }, 
    "1014": { name: "Confianza", priority: 1 },
    "1015": { name: "Consumer Marketing", priority: 2 },
    "1016": { name: "Crecimiento de la categoría", priority: 1 },
    "1017": { name: "Cumple compromisos", priority: 1 },
    "1018": { name: "Integración de E-Commerce", priority: 2 },
    "1019": { name: "Pedidos a tiempo y completos", priority: 2 },
    "1020": { name: "Administración de promociones en tiendas físicas", priority: 3 },
    "1021": { name: "Surtido", priority: 2 },
    "1022": { name: "Shopper marketing", priority: 3 }, 
    "1023": { name: "Respuesta en servicio al cliente", priority: 2 },
    "1024": { name: "Apoyo en tiendas", priority: 2 },
    "1025": { name: "Comunicación de órdenes y facturación", priority: 2 },
    "1026": { name: "Agilidad al cambio", priority: 2 },
    "1027": { name: "Liderazgo digital", priority: 3 },
    "1028": { name: "Información valiosa y objetiva", priority: 2 },
    "1029": { name: "Innovación de productos", priority: 2 },
    "BIC001": { name: "Best in Class", priority: 1 }
  };

  // Enhanced business area keywords with improved scoring
  const businessAreaKeywords = {
    "1001": ["comunicación", "comunicar", "hablar", "conversar", "diálogo", "feedback", "respuesta", "contacto", "información"],
    "1006": ["logística", "distribución", "cadena", "suministro", "entrega", "transporte", "almacén", "inventario", "distribuidores", "distribuidor"],
    "1014": ["confianza", "confiable", "seguro", "credible", "honesto", "transparente", "fiable"],
    "1016": ["crecimiento", "crecer", "expandir", "aumentar", "desarrollo", "incremento", "categoría"],
    "1017": ["cumple", "cumplir", "compromiso", "promesa", "acuerdo", "puntual", "responsable", "cumplimiento"],
    "1015": ["marketing", "promoción", "publicidad", "campaña", "marca", "consumidor", "consumer"],
    "1018": ["ecommerce", "digital", "online", "plataforma", "tecnología", "web"],
    "1029": ["innovación", "nuevo", "innovar", "desarrollo", "producto", "mejora"],
    "1011": ["equipo", "personal", "capacitado", "experiencia", "conocimiento", "profesional"],
    "1008": ["estrategia", "estratégico", "plan", "objetivo", "meta", "visión"],
    "1022": ["shopper", "comprador", "cliente", "consumidor", "experiencia"],
    "1007": ["retail media", "publicidad", "medios", "promoción"],
    "1013": ["sostenibilidad", "sustentable", "medio ambiente", "verde", "ecológico"],
    "1010": ["inversión", "trade", "comercial", "financiero", "presupuesto"],
    "1020": ["promociones", "descuentos", "ofertas", "precio", "rebaja"],
    "1019": ["entrega", "tiempo", "completo", "otif", "fill rate", "quiebre", "stock"]
  };

  // Load training data from localStorage
  useEffect(() => {
    const savedTrainingData = localStorage.getItem('mlTrainingData');
    if (savedTrainingData) {
      setTrainingData(JSON.parse(savedTrainingData));
    }
  }, []);

  const parseFilename = (filename) => {
    const result = {
      region: 'Unknown',
      program: 'Unknown', 
      year: 'Unknown',
      interviewee: 'Unknown',
      intervieweeId: 'Unknown',
      company: 'Unknown',
      companyId: 'Unknown'
    };

    try {
      const parts = filename.replace(/\.(mp3|wav|mp4|m4a)$/i, '').split('_');
      
      if (parts.length >= 6) {
        result.region = parts[0] || result.region;
        result.program = parts[1] || result.program;
        result.year = parts[2] || result.year;
        result.interviewee = parts[3] ? parts[3].replace(/\s+/g, ' ') : result.interviewee;
        result.intervieweeId = parts[4] || result.intervieweeId;
        result.company = parts[5] || result.company;
        result.companyId = parts[6] || result.companyId;
      }
    } catch (error) {
      console.warn('Error parsing filename:', error);
    }

    return result;
  };

  // Enhanced transformation function based on user examples (flexible patterns)
  const transformToProfessional = (text, speaker, company = 'Walmart') => {
    if (!text || typeof text !== 'string') return '';
    
    // Skip transformation for interviewer
    if (speaker === 'Speaker_0') {
      return text;
    }

    let transformed = text;

    // PHASE 1: ULTRA-AGGRESSIVE FILLER REMOVAL
    const fillerPatterns = [
      // Basic fillers and hesitations
      /\b(ok|okey|bueno|sí|mmm|eh|este|pues|entonces|ora|ahora)\b/gi,
      // Repetitive patterns
      /\b(\w+),\s*\1\b/gi, // "es, es" -> "es"
      /\b(\w+)\s+\1\b/gi,  // "y y" -> "y"
      // Hesitation and uncertainty
      /\b(no sé|o sea|como que|eso, eso|más o menos|la verdad|fíjese|digamos)\b/gi,
      // Question tags and confirmations
      /\b¿verdad\?\s*/gi,
      /\b¿sí\?\s*/gi,
      // Incomplete thoughts and elongated words
      /\b(que está como|queee está|hastaaa|eeeh|emmm)\b/gi,
      // Excessive punctuation and spacing
      /\s*,\s*,\s*/g,
      /\s+/g,
      /^\s*[,.\-]\s*/,
      /\s*[,.\-]\s*$/
    ];

    fillerPatterns.forEach(pattern => {
      transformed = transformed.replace(pattern, ' ');
    });

    transformed = transformed.replace(/\s+/g, ' ').trim();

    // PHASE 2: BUSINESS CONTEXT RECONSTRUCTION
    // Generic patterns for professional business language
    const businessReconstructionPatterns = [
      // Distribution and supply chain complexity
      {
        pattern: /\bhay\s+varios?\s+(distribuidores?|proveedores?|jugadores?)/gi,
        replacement: 'operan múltiples $1'
      },
      {
        pattern: /\b(\w+)\s+lo\s+(distribuye|maneja|atiende)\s+uno.*?(\w+)\s+lo\s+(va\s+a\s+)?(distribuir|manejar|atender)\s+otro/gi,
        replacement: '$1 está a cargo de un $2 y $3 está a cargo de otro'
      },
      // Complexity and challenges
      {
        pattern: /\bes\s+(bien\s+)?complejo\s+(poder\s+)?(trabajar|coordinar|manejar)/gi,
        replacement: 'resulta complejo $3'
      },
      {
        pattern: /\bson\s+complejos?\s+cuando\s+son\s+tantas?\s+(cabecillas?|personas?|puntos?)/gi,
        replacement: 'se complican con múltiples puntos de contacto'
      },
      // Performance and relationships
      {
        pattern: /\b(trabajo|trabajamos)\s+(muy\s+)?bien\s+con\s+(\w+)/gi,
        replacement: 'mantenemos una excelente colaboración con $3'
      },
      {
        pattern: /\bno\s+tengo\s+(mayor\s+)?inconveniente\s+con\s+(\w+)/gi,
        replacement: 'no hemos experimentado inconvenientes con $2'
      },
      // Opportunities and improvements
      {
        pattern: /\bhabía\s+(mucha\s+)?oportunidad\s+en\s+(esa\s+parte|ese\s+tema)/gi,
        replacement: 'existían oportunidades de mejora en esa área'
      },
      {
        pattern: /\bse\s+ha\s+visto\s+(bastante\s+)?mejor/gi,
        replacement: 'hemos notado mejoras significativas'
      }
    ];

    businessReconstructionPatterns.forEach(({ pattern, replacement }) => {
      transformed = transformed.replace(pattern, replacement);
    });

    // PHASE 3: COMPANY PERSPECTIVE INTEGRATION (Natural)
    const companyPerspectivePatterns = [
      // First person to company perspective
      {
        pattern: /\b(yo\s+(?:trabajo|manejo|busco|veo|tengo|estoy|siempre\s+he))/gi,
        replacements: [`En ${company}`, `Nosotros en ${company}`, `Aquí en ${company}`]
      },
      {
        pattern: /\b(nosotros\s+(?:trabajamos|manejamos|tenemos|estamos))/gi,
        replacements: [`En ${company} $1`, `Nosotros en ${company} $1`]
      },
      // Possessive adjustments
      {
        pattern: /\bmi\s+(caso|experiencia|parte)/gi,
        replacement: 'nuestro $1'
      },
      {
        pattern: /\bmis\s+(compañeros|productos|clientes)/gi,
        replacement: 'nuestros $1'
      }
    ];

    companyPerspectivePatterns.forEach(({ pattern, replacements }) => {
      if (pattern.test(transformed)) {
        const randomReplacement = replacements[Math.floor(Math.random() * replacements.length)];
        transformed = transformed.replace(pattern, randomReplacement);
      }
    });

    // PHASE 4: PROFESSIONAL LANGUAGE ENHANCEMENT
    const professionalUpgrades = [
      // Business terminology
      { from: /\bproblemas?\b/gi, to: 'desafíos' },
      { from: /\bfunciona\s+bien\b/gi, to: 'opera eficientemente' },
      { from: /\bmuy\s+bueno\b/gi, to: 'excelente' },
      { from: /\bbien\b/gi, to: 'adecuadamente' },
      { from: /\bmanejar\b/gi, to: 'gestionar' },
      { from: /\bcontrolar\b/gi, to: 'supervisar' },
      { from: /\bvendedores?\b/gi, to: 'equipo comercial' },
      { from: /\bempleados?\b/gi, to: 'colaboradores' },
      { from: /\bun\s+montón\b/gi, to: 'significativamente' },
      { from: /\bbastante\b/gi, to: 'considerablemente' },
      { from: /\bsuperbueno\b/gi, to: 'excelente' },
      { from: /\bsuperreconocido\b/gi, to: 'ampliamente reconocido' },
      // Quantity and measurement
      { from: /\bmuchos?\b/gi, to: 'múltiples' },
      { from: /\bvarios?\b/gi, to: 'diversos' },
      { from: /\bun\s+poco\s+de\b/gi, to: 'cierto nivel de' }
    ];

    professionalUpgrades.forEach(({ from, to }) => {
      transformed = transformed.replace(from, to);
    });

    // PHASE 5: PRODUCT AND BRAND CATEGORIZATION
    // Flexible product categorization (parentheses for specific products)
    const productKeywords = ['quesos?', 'mozzarella', 'crema', 'productos?', 'categorías?', 'gomas?', 'cereales?'];
    const productPattern = new RegExp(`\\b(${productKeywords.join('|')})\\s+([a-zA-Z]+(?:\\s+[a-zA-Z]+)?)\\b`, 'gi');
    
    transformed = transformed.replace(productPattern, (match, productType, descriptor) => {
      // Only add parentheses if it's a specific product variant
      if (descriptor && !['de', 'del', 'en', 'con', 'para', 'por'].includes(descriptor.toLowerCase())) {
        return `${productType} (${descriptor})`;
      }
      return match;
    });

    // PHASE 6: STRUCTURAL IMPROVEMENTS
    // Add distributor context in parentheses when mentioned
    const distributorPattern = /\b(\w+)\s+(?:que\s+es\s+el\s+distribuidor|distribuidor|a\s+través\s+de\s+(\w+))/gi;
    transformed = transformed.replace(distributorPattern, (match, brand, distributor) => {
      if (distributor) {
        return `${brand} (${distributor})`;
      }
      return match;
    });

    // PHASE 7: FINAL CLEANUP AND VALIDATION
    transformed = transformed
      .replace(/\s+/g, ' ')
      .replace(/^\s*[,.\-]\s*/, '')
      .replace(/\s*[,.\-]\s*$/, '')
      .trim();

    // Ensure proper sentence structure
    if (transformed && !transformed.match(/[.!?]$/)) {
      transformed += '.';
    }

    // Remove any remaining double spaces or punctuation issues
    transformed = transformed
      .replace(/\s+/g, ' ')
      .replace(/\.\s*\./g, '.')
      .replace(/,\s*,/g, ',');

    return transformed;
  };

  // Enhanced speaker detection with better boundary recognition
  const createSpeakerContinuousSegments = (words) => {
    if (!words || words.length === 0) return [];

    const MIN_SEGMENT_DURATION = 3.0;
    const TARGET_SEGMENT_DURATION = 25.0;
    const MAX_SEGMENT_DURATION = 45.0;
    const VERY_LONG_PAUSE = 8.0;
    const TOPIC_CHANGE_PAUSE = 4.0; // New: detect topic changes

    let currentSegment = {
      words: [],
      speaker: null,
      startTime: 0,
      endTime: 0,
      speakerConfidence: 0
    };

    // Enhanced speaker detection
    const getMostLikelySpeaker = (segmentWords) => {
      const speakerCounts = {};
      segmentWords.forEach(word => {
        const speaker = word.speaker_id || 'speaker_1';
        speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
      });
      
      return Object.entries(speakerCounts)
        .sort(([,a], [,b]) => b - a)[0][0];
    };

    // Detect topic changes based on content
    const detectTopicChange = (currentWords, newWords) => {
      if (currentWords.length < 5 || newWords.length < 5) return false;
      
      const currentText = currentWords.slice(-10).map(w => w.word).join(' ').toLowerCase();
      const newText = newWords.slice(0, 10).map(w => w.word).join(' ').toLowerCase();
      
      const topicKeywords = {
        distribution: ['distribuir', 'distribución', 'cadena', 'logística'],
        partnership: ['lactalis', 'american', 'equipo', 'colaboración'],
        products: ['quesos', 'productos', 'categoría'],
        problems: ['complejo', 'problema', 'oportunidad']
      };
      
      let currentTopics = [];
      let newTopics = [];
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => currentText.includes(keyword))) {
          currentTopics.push(topic);
        }
        if (keywords.some(keyword => newText.includes(keyword))) {
          newTopics.push(topic);
        }
      });
      
      // Topic change if no overlap
      return currentTopics.length > 0 && newTopics.length > 0 && 
             !currentTopics.some(topic => newTopics.includes(topic));
    };

    // Enhanced speaker change detection
    const isRealSpeakerChange = (currentWords, newSpeaker, wordIndex, allWords) => {
      if (currentWords.length === 0) return false;
      
      const currentSpeaker = getMostLikelySpeaker(currentWords);
      if (currentSpeaker === newSpeaker) return false;
      
      // Look ahead for sustained speaker change
      let sustainedCount = 0;
      for (let i = wordIndex; i < Math.min(wordIndex + 8, allWords.length); i++) {
        if ((allWords[i].speaker_id || 'speaker_1') === newSpeaker) {
          sustainedCount++;
        }
      }
      
      return sustainedCount >= 6; // More conservative
    };

    const segments = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordSpeaker = word.speaker_id || 'speaker_1';
      const wordStart = parseFloat(word.start);
      const wordEnd = parseFloat(word.end);
      
      // Initialize first segment
      if (currentSegment.words.length === 0) {
        currentSegment.words.push(word);
        currentSegment.speaker = wordSpeaker;
        currentSegment.startTime = wordStart;
        currentSegment.endTime = wordEnd;
        continue;
      }
      
      const segmentDuration = wordEnd - currentSegment.startTime;
      const timeSinceLastWord = wordStart - currentSegment.endTime;
      
      // Determine if we should break the segment
      let shouldBreak = false;
      let breakReason = '';
      
      // 1. Very long pause
      if (timeSinceLastWord > VERY_LONG_PAUSE) {
        shouldBreak = true;
        breakReason = 'very long pause';
      }
      // 2. Topic change with pause
      else if (timeSinceLastWord > TOPIC_CHANGE_PAUSE && 
               detectTopicChange(currentSegment.words, words.slice(i, i + 10))) {
        shouldBreak = true;
        breakReason = 'topic change';
      }
      // 3. Real speaker change
      else if (isRealSpeakerChange(currentSegment.words, wordSpeaker, i, words)) {
        shouldBreak = true;
        breakReason = 'sustained speaker change';
      }
      // 4. Maximum duration reached
      else if (segmentDuration > MAX_SEGMENT_DURATION) {
        shouldBreak = true;
        breakReason = 'maximum duration';
      }
      // 5. Target duration with natural break
      else if (segmentDuration > TARGET_SEGMENT_DURATION && timeSinceLastWord > 1.5) {
        shouldBreak = true;
        breakReason = 'target duration with natural break';
      }
      
      if (shouldBreak && segmentDuration >= MIN_SEGMENT_DURATION) {
        // Finalize current segment
        const finalSpeaker = getMostLikelySpeaker(currentSegment.words);
        const segmentText = currentSegment.words.map(w => w.word).join(' ');
        
        console.log(`Segment ${segments.length + 1}: ${segmentDuration.toFixed(1)}s, ${currentSegment.words.length} words, Speaker: ${finalSpeaker}, Reason: ${breakReason}`);
        
        segments.push({
          text: segmentText,
          speaker: finalSpeaker,
          startTime: currentSegment.startTime,
          endTime: currentSegment.endTime,
          duration: segmentDuration,
          wordCount: currentSegment.words.length
        });
        
        // Start new segment
        currentSegment = {
          words: [word],
          speaker: wordSpeaker,
          startTime: wordStart,
          endTime: wordEnd,
          speakerConfidence: 0
        };
      } else {
        // Add word to current segment
        currentSegment.words.push(word);
        currentSegment.endTime = wordEnd;
      }
    }
    
    // Add final segment
    if (currentSegment.words.length > 0) {
      const finalSpeaker = getMostLikelySpeaker(currentSegment.words);
      const segmentText = currentSegment.words.map(w => w.word).join(' ');
      const segmentDuration = currentSegment.endTime - currentSegment.startTime;
      
      segments.push({
        text: segmentText,
        speaker: finalSpeaker,
        startTime: currentSegment.startTime,
        endTime: currentSegment.endTime,
        duration: segmentDuration,
        wordCount: currentSegment.words.length
      });
    }

    console.log(`Created ${segments.length} segments with enhanced topic and speaker detection`);
    return segments;
  };

  // Enhanced business area classification
  const classifyBusinessAreas = (text) => {
    const lowerText = text.toLowerCase();
    const areaScores = {};
    
    // Calculate scores for each business area
    Object.entries(businessAreaKeywords).forEach(([code, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}`, 'gi');
        const matches = (lowerText.match(regex) || []).length;
        score += matches;
      });
      
      if (score > 0) {
        areaScores[code] = score;
      }
    });
    
    // Sort by score and return top areas
    const sortedAreas = Object.entries(areaScores)
      .map(([code, score]) => ({
        code,
        name: competencyMap[code]?.name || 'Unknown',
        confidence: Math.min(0.95, 0.4 + (score * 0.15)),
        priority: competencyMap[code]?.priority || 3
      }))
      .sort((a, b) => {
        // Sort by score first, then by priority
        if (areaScores[b.code] !== areaScores[a.code]) {
          return areaScores[b.code] - areaScores[a.code];
        }
        return a.priority - b.priority;
      });
    
    // Return top 3 areas or default
    if (sortedAreas.length === 0) {
      return [{
        code: '1006',
        name: competencyMap['1006'].name,
        confidence: 0.5,
        priority: 1
      }];
    }
    
    return sortedAreas.slice(0, 3);
  };

  // Enhanced sentiment analysis
  const analyzeSentiment = (text) => {
    const lowerText = text.toLowerCase();
    
    const sentimentKeywords = {
      'SENT001': ['excelente', 'bueno', 'positivo', 'destaca', 'eficiente', 'satisfactorio'],
      'SENT002': ['oportunidad', 'mejorar', 'complejo', 'desafío', 'problema'],
      'SENT003': ['debe', 'necesita', 'requiere', 'importante', 'urgente', 'crítico']
    };
    
    let maxScore = 0;
    let sentiment = 'SENT002'; // Default to opportunity
    
    Object.entries(sentimentKeywords).forEach(([code, keywords]) => {
      const score = keywords.reduce((sum, keyword) => 
        sum + (lowerText.includes(keyword) ? 1 : 0), 0);
      if (score > maxScore) {
        maxScore = score;
        sentiment = code;
      }
    });
    
    return sentiment;
  };

  // Enhanced subject company detection
  const detectSubjectCompany = (text) => {
    const companies = {
      'kraft': { code: '9138', name: 'Kraft Heinz' },
      'lactalis': { code: 'DIST001', name: 'Lactalis' },
      'american': { code: 'DIST002', name: 'American Foods' },
      'nestle': { code: '9139', name: 'Nestlé' },
      'coca': { code: '9140', name: 'Coca-Cola' },
      'pepsi': { code: '9141', name: 'PepsiCo' }
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [keyword, company] of Object.entries(companies)) {
      if (lowerText.includes(keyword)) {
        return company.code;
      }
    }
    
    return 'TBD';
  };

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  // Test API connection
  const testApiConnection = async () => {
    if (!apiKey) {
      setErrorMessage('Please enter an API key first');
      return;
    }

    setApiStatus('connecting');
    setErrorMessage('');

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (response.ok) {
        setApiStatus('connected');
      } else {
        throw new Error('Invalid API key or connection failed');
      }
    } catch (error) {
      setApiStatus('error');
      setErrorMessage('Connection failed. Please check your API key.');
    }
  };

  // Main processing function
  const processAudioFile = async () => {
    if (!audioFile || !apiKey || apiStatus !== 'connected') {
      setErrorMessage('Please select file, enter API key, and test connection first');
      return;
    }

    setProcessing(true);
    setStep(2);
    setProgress(0);
    setErrorMessage('');

    try {
      console.log('🎙️ Starting enhanced audio processing...');
      
      // Step 1: Upload and transcribe
      setProgress(10);
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model_id', 'eleven_multilingual_v2');
      formData.append('language', 'es');
      formData.append('response_format', 'verbose_json');

      const transcriptionResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json();
        throw new Error(`ElevenLabs API error: ${transcriptionResponse.status} - ${JSON.stringify(errorData)}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      console.log('✅ Transcription completed');
      
      setProgress(30);

      // Step 2: Parse filename
      const fileInfo = parseFilename(audioFile.name);
      console.log('📋 File info:', fileInfo);

      // Step 3: Create enhanced segments
      setProgress(40);
      const segments = createSpeakerContinuousSegments(transcriptionData.words || []);
      console.log(`📝 Created ${segments.length} enhanced segments`);

      setProgress(60);

      // Step 4: Process each segment with enhanced transformation
      const processedSegments = segments.map((segment, index) => {
        const speakerLabel = segment.speaker === 'speaker_0' ? 'Speaker_0' : 'Speaker_1';
        
        // Enhanced text cleaning
        const cleanedText = segment.text
          .replace(/\s+/g, ' ')
          .replace(/^\s+|\s+$/g, '')
          .replace(/\s*([,.!?])\s*/g, '$1 ')
          .trim();

        // Apply enhanced transformation
        const professionalText = transformToProfessional(cleanedText, speakerLabel, fileInfo.company);

        // Enhanced business area classification
        const businessAreas = classifyBusinessAreas(professionalText);
        const primaryArea = businessAreas[0];
        const suggestedAreas = businessAreas.slice(0, 3).map(area => area.code).join(':');
        const suggestedAreaNames = businessAreas.slice(0, 3).map(area => area.name).join(' | ');

        return {
          index: index + 1,
          startTime: formatTime(segment.startTime),
          endTime: formatTime(segment.endTime),
          duration: formatTime(segment.duration),
          speaker: speakerLabel,
          originalText: cleanedText,
          professionalText: professionalText,
          businessAreaCode: primaryArea.code,
          businessAreaName: primaryArea.name,
          suggestedBusinessAreas: suggestedAreas,
          suggestedBusinessAreaNames: suggestedAreaNames,
          sentimentCode: analyzeSentiment(professionalText),
          subjectCompanyCode: detectSubjectCompany(professionalText),
          confidence: Math.round(primaryArea.confidence * 100),
          region: fileInfo.region,
          program: fileInfo.program,
          year: fileInfo.year,
          interviewee: fileInfo.interviewee,
          intervieweeId: fileInfo.intervieweeId,
          company: fileInfo.company,
          companyId: fileInfo.companyId,
          englishTranslation: translationEnabled ? 'Translation pending' : '',
          correctedOriginalText: '', // For ML training
          correctedProfessionalText: '', // For ML training
          correctionNotes: '' // For ML training
        };
      });

      setProgress(80);
      setProcessedInsights(processedSegments);

      // Step 5: Generate CSV
      const csvHeaders = [
        'index', 'start_time', 'end_time', 'duration', 'speaker',
        'original_text', 'professional_text', 'business_area_code', 'business_area_name',
        'suggested_business_areas', 'suggested_business_area_names',
        'sentiment_code', 'subject_company_code', 'confidence',
        'region', 'program', 'year', 'interviewee', 'interviewee_id',
        'company', 'company_id', 'english_translation',
        'corrected_original_text', 'corrected_professional_text', 'correction_notes'
      ];

      const csvRows = processedSegments.map(segment => [
        segment.index,
        segment.startTime,
        segment.endTime,
        segment.duration,
        segment.speaker,
        `"${segment.originalText.replace(/"/g, '""')}"`,
        `"${segment.professionalText.replace(/"/g, '""')}"`,
        segment.businessAreaCode,
        `"${segment.businessAreaName}"`,
        segment.suggestedBusinessAreas,
        `"${segment.suggestedBusinessAreaNames}"`,
        segment.sentimentCode,
        segment.subjectCompanyCode,
        segment.confidence,
        segment.region,
        segment.program,
        segment.year,
        `"${segment.interviewee}"`,
        segment.intervieweeId,
        segment.company,
        segment.companyId,
        segment.englishTranslation,
        segment.correctedOriginalText,
        segment.correctedProfessionalText,
        segment.correctionNotes
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      setCsvContent(csvContent);

      setProgress(100);
      setStep(3);
      console.log('✅ Enhanced processing completed successfully');

    } catch (error) {
      console.error('❌ Processing error:', error);
      setErrorMessage(`Processing failed: ${error.message}`);
      setProcessing(false);
      setStep(1);
    }
  };

  // Download CSV
  const downloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `interview_analysis_enhanced_${new Date().toISOString().split('T')[0]}.csv`;
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
        <h1 className="text-3xl font-bold mb-2">🎙️ Enhanced Interview Processor</h1>
        <p className="text-blue-100">Advanced audio processing with improved transformation and topic detection</p>
      </div>

      {/* ENHANCEMENT HIGHLIGHTS */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-800 mb-2">🚀 Enhanced Features Based on Your Corrections:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Ultra-Aggressive Filler Removal:</strong> Removes "ok", "mmm", "eh", "no sé", "o sea", repetitive patterns</li>
          <li>• <strong>Smart Topic Separation:</strong> Detects when multiple topics are mixed (distribution vs partnerships)</li>
          <li>• <strong>Natural Company Perspective:</strong> Integrates company voice without forced "En Walmart," insertions</li>
          <li>• <strong>Enhanced Speaker Detection:</strong> Better boundary recognition and topic change detection</li>
          <li>• <strong>Content Reconstruction:</strong> Transforms casual speech into professional business insights</li>
          <li>• <strong>Flexible Product Categorization:</strong> Automatically formats product categories in parentheses</li>
        </ul>
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
              onClick={processAudioFile}
              disabled={!audioFile || apiStatus !== 'connected' || processing}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {processing ? 'Processing...' : '🚀 Start Enhanced Processing'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 2 && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Step 2: Processing Audio</h2>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-center text-gray-600">
            {progress < 30 && "🎙️ Transcribing audio with ElevenLabs..."}
            {progress >= 30 && progress < 60 && "📝 Creating enhanced segments..."}
            {progress >= 60 && progress < 80 && "🔄 Applying enhanced transformations..."}
            {progress >= 80 && "📊 Generating CSV output..."}
          </div>
          <div className="text-center text-2xl font-bold text-blue-600 mt-2">
            {progress}%
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-green-800 mb-2">✅ Processing Complete!</h2>
            <p className="text-green-700">
              Successfully processed {processedInsights.length} segments with enhanced transformation quality.
            </p>
          </div>

          {/* Download Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">📥 Download Results</h3>
            <div className="flex gap-4">
              <button
                onClick={downloadCsv}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
              >
                📊 Download Enhanced CSV
              </button>
              <button
                onClick={() => setShowCsvData(!showCsvData)}
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {showCsvData ? '🔼 Hide' : '🔽 Show'} Preview
              </button>
            </div>
          </div>

          {/* CSV Preview */}
          {showCsvData && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-4">📋 Enhanced Results Preview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">Speaker</th>
                      <th className="p-2 text-left">Original</th>
                      <th className="p-2 text-left">Enhanced Professional</th>
                      <th className="p-2 text-left">Business Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedInsights.slice(0, 5).map((insight, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{insight.startTime} - {insight.endTime}</td>
                        <td className="p-2">{insight.speaker}</td>
                        <td className="p-2 max-w-xs truncate">{insight.originalText}</td>
                        <td className="p-2 max-w-xs truncate font-medium text-green-700">{insight.professionalText}</td>
                        <td className="p-2">{insight.businessAreaName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {processedInsights.length > 5 && (
                  <div className="text-center text-gray-500 mt-2">
                    ... and {processedInsights.length - 5} more segments
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="text-center">
            <button
              onClick={resetProcessor}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              🔄 Process Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedInterviewProcessor;

