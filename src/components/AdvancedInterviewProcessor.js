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
  const fileInputRef = useRef(null);

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

  // Minimal text cleaning - preserve all content
  const cleanTranscriptionText = (text) => {
    return text
      .replace(/\s+/g, ' ')
      .trim();
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

  // Speaker continuity with natural conversation flow
  const parseApiResponseImproved = (apiResponse) => {
    const segments = [];
    
    if (apiResponse.words && Array.isArray(apiResponse.words)) {
      const words = apiResponse.words;
      console.log(`Processing ${words.length} words for speaker-continuous segments`);
      
      // Enhanced speaker detection and continuity
      const VERY_LONG_PAUSE = 8.0;               // Only break on very long pauses (8+ seconds)
      const MIN_SEGMENT_DURATION = 8.0;          // Minimum 8 seconds per segment
      const TARGET_SEGMENT_DURATION = 25.0;      // Target 25 seconds like user's example
      const MAX_SEGMENT_DURATION = 60.0;         // Maximum 60 seconds
      const SPEAKER_CHANGE_BUFFER = 2.0;         // Buffer to confirm real speaker changes
      
      let currentSegment = {
        words: [],
        speaker: null,
        startTime: 0,
        endTime: 0,
        speakerConfidence: 0
      };
      
      // Helper function to determine the most likely speaker for a segment
      const getMostLikelySpeaker = (words) => {
        const speakerCounts = {};
        words.forEach(word => {
          const speaker = word.speaker_id || 'speaker_1';
          speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
        });
        
        // Return the speaker with the most words in this segment
        return Object.entries(speakerCounts).reduce((a, b) => 
          speakerCounts[a[0]] > speakerCounts[b[0]] ? a : b
        )[0];
      };
      
      // Helper function to detect if there's a real speaker change
      const isRealSpeakerChange = (currentWords, newSpeaker, wordIndex, allWords) => {
        if (currentWords.length === 0) return false;
        
        const currentSpeaker = getMostLikelySpeaker(currentWords);
        if (currentSpeaker === newSpeaker) return false;
        
        // Look ahead to see if this speaker change is sustained
        let sustainedCount = 0;
        for (let i = wordIndex; i < Math.min(wordIndex + 10, allWords.length); i++) {
          if ((allWords[i].speaker_id || 'speaker_1') === newSpeaker) {
            sustainedCount++;
          }
        }
        
        // Only consider it a real speaker change if sustained for at least 5 words
        return sustainedCount >= 5;
      };
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const currentSpeaker = word.speaker_id || 'speaker_1';
        const wordStart = word.start || 0;
        const wordEnd = word.end || wordStart + 0.5;
        
        // Check for segmentation conditions
        const veryLongPause = currentSegment.words.length > 0 && 
                             (wordStart - currentSegment.endTime) > VERY_LONG_PAUSE;
        
        const segmentTooLong = currentSegment.words.length > 0 &&
                              (wordEnd - currentSegment.startTime) > MAX_SEGMENT_DURATION;
        
        // Real speaker change detection
        const realSpeakerChange = isRealSpeakerChange(currentSegment.words, currentSpeaker, i, words);
        
        // Natural conversation break: Complete thought + good duration
        const naturalBreak = currentSegment.words.length > 0 &&
                            (wordEnd - currentSegment.startTime) >= TARGET_SEGMENT_DURATION &&
                            word.text && 
                            (/[.!?]$/.test(word.text.trim()) || 
                             /\b(¿verdad\?|¿sí\?|¿no\?|entonces|bueno|ok|okay)\b/i.test(word.text)) &&
                            (wordStart - currentSegment.endTime) > 1.0; // Plus a small pause
        
        // ONLY create new segment if we have a clear reason AND minimum duration
        const shouldBreak = (realSpeakerChange || veryLongPause || segmentTooLong || naturalBreak) && 
                           currentSegment.words.length > 0 &&
                           (currentSegment.endTime - currentSegment.startTime) >= MIN_SEGMENT_DURATION;
        
        if (shouldBreak) {
          // Determine the most likely speaker for this segment
          const segmentSpeaker = getMostLikelySpeaker(currentSegment.words);
          
          // Create segment with ALL content preserved
          const segmentText = currentSegment.words.map(w => w.text).join(' ');
          const cleanedText = cleanTranscriptionText(segmentText);
          const avgConfidence = calculateImprovedConfidence(currentSegment.words);
          
          // Accept ALL segments - no filtering
          if (cleanedText.trim().length > 0) {
            segments.push({
              start_time: formatTime(currentSegment.startTime),
              end_time: formatTime(currentSegment.endTime),
              speaker: segmentSpeaker === 'speaker_1' ? 'Speaker_1' : 'Speaker_0',
              confidence: avgConfidence,
              text: cleanedText
            });
            
            const duration = currentSegment.endTime - currentSegment.startTime;
            const breakReason = realSpeakerChange ? 'Speaker Change' : 
                               veryLongPause ? 'Long Pause' : 
                               segmentTooLong ? 'Too Long' : 'Natural Break';
            
            console.log(`Created segment: ${formatTime(currentSegment.startTime)} - ${formatTime(currentSegment.endTime)} (${duration.toFixed(1)}s) [${breakReason}] Speaker: ${segmentSpeaker}`);
          }
          
          // Start new segment
          currentSegment = {
            words: [word],
            speaker: currentSpeaker,
            startTime: wordStart,
            endTime: wordEnd,
            speakerConfidence: 1
          };
        } else {
          // Add word to current segment
          currentSegment.words.push(word);
          if (currentSegment.words.length === 1) {
            currentSegment.speaker = currentSpeaker;
            currentSegment.startTime = wordStart;
          }
          currentSegment.endTime = wordEnd;
        }
      }
      
      // ALWAYS add the final segment
      if (currentSegment.words.length > 0) {
        const segmentSpeaker = getMostLikelySpeaker(currentSegment.words);
        const segmentText = currentSegment.words.map(w => w.text).join(' ');
        const cleanedText = cleanTranscriptionText(segmentText);
        const avgConfidence = calculateImprovedConfidence(currentSegment.words);
        
        segments.push({
          start_time: formatTime(currentSegment.startTime),
          end_time: formatTime(currentSegment.endTime),
          speaker: segmentSpeaker === 'speaker_1' ? 'Speaker_1' : 'Speaker_0',
          confidence: avgConfidence,
          text: cleanedText
        });
        
        const duration = currentSegment.endTime - currentSegment.startTime;
        console.log(`Final segment: ${formatTime(currentSegment.startTime)} - ${formatTime(currentSegment.endTime)} (${duration.toFixed(1)}s) Speaker: ${segmentSpeaker}`);
      }
      
      console.log(`✅ Created ${segments.length} speaker-continuous segments`);
      
      // Log segment analysis for debugging
      segments.forEach((segment, index) => {
        const startSeconds = parseTimeToSeconds(segment.start_time);
        const endSeconds = parseTimeToSeconds(segment.end_time);
        const duration = endSeconds - startSeconds;
        console.log(`Segment ${index + 1}: ${segment.start_time} - ${segment.end_time} (${duration.toFixed(1)}s) ${segment.speaker} - "${segment.text.substring(0, 80)}..."`);
      });
      
      // Check for speaker continuity issues
      let speakerIssues = 0;
      for (let i = 1; i < segments.length; i++) {
        const prevSpeaker = segments[i-1].speaker;
        const currSpeaker = segments[i].speaker;
        const prevEnd = parseTimeToSeconds(segments[i-1].end_time);
        const currStart = parseTimeToSeconds(segments[i].start_time);
        const gap = currStart - prevEnd;
        
        if (prevSpeaker === currSpeaker && gap < 3.0) {
          speakerIssues++;
          console.warn(`⚠️ Potential speaker continuity issue: Segments ${i} and ${i+1} are same speaker (${currSpeaker}) with only ${gap.toFixed(1)}s gap`);
        }
      }
      
      if (speakerIssues > 0) {
        console.warn(`⚠️ Found ${speakerIssues} potential speaker continuity issues that could be merged`);
      }
      
      return segments;
    }
    
    // Fallback for simple text response
    if (apiResponse.text) {
      const sentences = apiResponse.text.split(/[.!?]+/).filter(s => s.trim().length > 5);
      
      sentences.forEach((sentence, index) => {
        const startTime = index * 20; // 20-second segments
        const endTime = (index + 1) * 20;
        
        segments.push({
          start_time: formatTime(startTime),
          end_time: formatTime(endTime),
          speaker: index % 2 === 0 ? 'Speaker_1' : 'Speaker_0',
          confidence: apiResponse.language_probability || 0.75,
          text: sentence.trim()
        });
      });
      
      return segments;
    }
    
    throw new Error('Unexpected API response format');
  };

  // Helper function to parse time to seconds
  const parseTimeToSeconds = (timeString) => {
    const parts = timeString.split(':');
    const minutes = parseInt(parts[0]);
    const secondsParts = parts[1].split('.');
    const seconds = parseInt(secondsParts[0]);
    const milliseconds = parseInt(secondsParts[1] || 0);
    return minutes * 60 + seconds + milliseconds / 1000;
  };

  // Improved transcription function
  const transcribeWithElevenLabsImproved = async (file) => {
    try {
      setProgress(10);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model_id', 'scribe_v1');
      formData.append('diarize', 'true');
      formData.append('num_speakers', '2');
      formData.append('tag_audio_events', 'false');
      formData.append('timestamps_granularity', 'word');
      formData.append('response_format', 'json');
      
      setProgress(20);

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey
        },
        body: formData
      });

      setProgress(60);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ ElevenLabs transcription completed');
      console.log('API Response structure:', {
        hasWords: !!result.words,
        wordCount: result.words?.length || 0,
        hasText: !!result.text,
        hasSpeakers: result.words?.some(w => w.speaker_id) || false,
        speakerDistribution: result.words?.reduce((acc, word) => {
          const speaker = word.speaker_id || 'unknown';
          acc[speaker] = (acc[speaker] || 0) + 1;
          return acc;
        }, {})
      });
      
      setProgress(80);
      const segments = parseApiResponseImproved(result);
      setProgress(90);
      return { success: true, segments };

    } catch (error) {
      console.error('❌ Transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
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

  // FIXED: Professional transformation ONLY for interviewee (Speaker_1)
  const transformToProfessionalImproved = (text, speaker, companyName = "la compañía") => {
    // INTERVIEWER (Speaker_0): Keep exactly as spoken for context
    if (speaker === "Speaker_0") {
      console.log(`📝 Preserving interviewer question as-is: "${text.substring(0, 50)}..."`);
      return text.replace(/\s+/g, ' ').trim(); // Only clean spacing
    }
    
    // INTERVIEWEE (Speaker_1): Apply professional transformation
    console.log(`🔄 Transforming interviewee response: "${text.substring(0, 50)}..."`);
    
    // Professional transformation for interviewee responses
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

    // Ensure proper capitalization
    if (professional.length > 0) {
      professional = professional.charAt(0).toUpperCase() + professional.slice(1);
    }
    
    // Only add period if it doesn't end with punctuation
    if (professional.length > 0 && 
        !professional.endsWith('.') && 
        !professional.endsWith('?') && 
        !professional.endsWith('!') &&
        !professional.endsWith(',')) {
      professional += '.';
    }
    
    console.log(`✅ Transformed to: "${professional.substring(0, 50)}..."`);
    return professional;
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

  // Enhanced auto-tagging - ONLY for interviewee responses
  const autoTagEnhanced = (text, speaker) => {
    const lowerText = text.toLowerCase();
    
    // ALWAYS mark interviewer segments as interviewer
    if (speaker === "Speaker_0") {
      return {
        businessArea: "INTERVIEWER",
        sentiment: "INTERVIEWER",
        isInterviewer: true,
        confidence: 1.0
      };
    }
    
    // For interviewee responses (Speaker_1), perform analysis
    
    // Detect Best in Class
    const bicKeywords = ["best in class", "mejor práctica", "referente", "líder", "ejemplo", "modelo", "ideal"];
    const isBestInClass = bicKeywords.some(keyword => lowerText.includes(keyword));
    
    if (isBestInClass) {
      return {
        businessArea: "BIC001",
        sentiment: "BIC001",
        isBestInClass: true,
        confidence: 0.9
      };
    }
    
    // Enhanced business area detection
    let businessArea = "1006"; // Default
    let confidence = 0.5;
    
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
        confidence = Math.min(0.9, 0.5 + (score * 0.15));
      }
    });
    
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
    
    return {
      businessArea,
      sentiment,
      confidence,
      isInterviewer: false,
      isBestInClass: false
    };
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

  // Simple translation function
  const translateToEnglish = async (text) => {
    if (!translationEnabled || !text || text.trim().length === 0) {
      return "Translation pending";
    }
    
    return "Translation pending - OpenAI integration needed";
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
      console.log('🎙️ Starting speaker-continuous transcription...');
      const transcription = await transcribeWithElevenLabsImproved(audioFile);
      
      if (!transcription.success) {
        throw new Error('Transcription failed');
      }
      
      console.log('📝 Processing speaker-continuous segments...');
      setProgress(40);

      const companyInfo = extractCompanyInfoImproved(audioFile.name);
      const insights = [];

      for (const [index, segment] of transcription.segments.entries()) {
        // Pass speaker to auto-tagging for proper classification
        const tags = autoTagEnhanced(segment.text, segment.speaker);
        
        // Apply transformation based on speaker
        const professionalText = transformToProfessionalImproved(
          segment.text, 
          segment.speaker, 
          companyInfo.company
        );
        
        const countries = detectCountriesEnhanced(segment.text);
        const subjectCompanyResult = detectSubjectCompanyEnhanced(segment.text);
        
        // Get English translation
        const englishTranslation = await translateToEnglish(professionalText);
        
        insights.push({
          file_name: audioFile.name,
          start_time: segment.start_time,
          end_time: segment.end_time,
          speaker: segment.speaker,
          confidence: segment.confidence,
          original_text: segment.text,
          professional_text: professionalText,
          english_translation: englishTranslation,
          
          // Respondent Information
          respondent_company: companyInfo.company,
          respondent_company_code: companyInfo.company_id,
          
          // Subject Information
          subject_company_code: tags.isBestInClass ? "BIC001" : subjectCompanyResult.code,
          subject_company: tags.isBestInClass ? "N/A - Best in Class" : subjectCompanyResult.company,
          
          // Analysis Results
          business_area_code: tags.businessArea,
          business_area: tags.isBestInClass ? "Best in Class" : competencyMap[tags.businessArea],
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
        
        // Update progress
        setProgress(40 + (index / transcription.segments.length) * 40);
      }

      setProcessedInsights(insights);
      setProgress(90);

      console.log('📊 Generating summary and CSV...');
      generateCsvContent(insights);
      setProgress(100);
      setStep(3);

    } catch (error) {
      console.error('❌ Processing error:', error);
      setErrorMessage(`Processing failed: ${error.message}`);
      setProcessing(false);
      setStep(1);
    }
  };

  // Generate CSV content
  const generateCsvContent = (insights) => {
    const headers = [
      'file_name', 'start_time', 'end_time', 'speaker', 'confidence',
      'original_text', 'professional_text', 'english_translation',
      'respondent_company', 'respondent_company_code', 'subject_company_code',
      'subject_company', 'business_area_code', 'business_area',
      'sentiment_code', 'sentiment', 'country_specific', 'countries',
      'is_best_in_class', 'needs_review', 'interviewer_type',
      'processing_date', 'confidence_level'
    ];
    
    const csvRows = [headers.join(',')];
    
    insights.forEach(insight => {
      const row = headers.map(header => {
        const value = insight[header] || '';
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
        <h1 className="text-3xl font-bold mb-2">🎙️ Advanced Interview Processor</h1>
        <p className="text-blue-100">Professional transformation for interviewee responses only</p>
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
              {processing ? 'Processing...' : '🚀 Start Processing (Interviewee Transformation Only)'}
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
              Processing with selective transformation...
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
                <div className="text-sm text-gray-600">Interviewer (Preserved)</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {processedInsights.filter(i => i.speaker === 'Speaker_1').length}
                </div>
                <div className="text-sm text-gray-600">Interviewee (Transformed)</div>
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
                📥 Download CSV
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
                <h3 className="font-semibold mb-2">CSV Data Preview</h3>
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
                <h3 className="font-semibold mb-4">Sample Results (Interviewer vs Interviewee)</h3>
                <div className="space-y-4">
                  {processedInsights.slice(0, 4).map((insight, index) => (
                    <div key={index} className={`border-l-4 pl-4 py-2 ${insight.speaker === 'Speaker_0' ? 'border-purple-500 bg-purple-50' : 'border-green-500 bg-green-50'}`}>
                      <div className="text-sm text-gray-600 mb-1">
                        {insight.start_time} - {insight.end_time} | {insight.speaker === 'Speaker_0' ? '🎤 Interviewer (Preserved)' : '👤 Interviewee (Transformed)'} | Confidence: {insight.confidence_level}
                      </div>
                      <div className="text-sm mb-2">
                        <strong>Original:</strong> {insight.original_text}
                      </div>
                      <div className="text-sm mb-2">
                        <strong>{insight.speaker === 'Speaker_0' ? 'Preserved' : 'Professional'}:</strong> {insight.professional_text}
                      </div>
                      {insight.speaker === 'Speaker_1' && (
                        <div className="text-xs text-gray-500">
                          Business Area: {insight.business_area} | Sentiment: {insight.sentiment} | 
                          Subject: {insight.subject_company}
                        </div>
                      )}
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

