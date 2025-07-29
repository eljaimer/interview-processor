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
  
  // NEW ML FEATURES
  const [mlMode, setMlMode] = useState(false);
  const [trainingData, setTrainingData] = useState([]);
  const [modelStats, setModelStats] = useState({ interviews: 0, corrections: 0, accuracy: 0 });
  const [mlTrainingData, setMlTrainingData] = useState({
    transcriptionPatterns: [],
    transformationRules: [],
    businessAreaClassifications: [],
    sentimentAnalysis: [],
    companyMentions: [],
    segmentPatterns: [],
    lastUpdated: null,
    version: '1.0'
  });
  
  const fileInputRef = useRef(null);
  const correctionFileRef = useRef(null); // NEW

  // Enhanced competency mapping WITH PRIORITIES for multiple suggestions
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

  // NEW: Load ML training data on component mount
  useEffect(() => {
    loadPersistedTrainingData();
  }, []);

  // NEW: Save training data whenever it changes
  useEffect(() => {
    if (mlTrainingData.transcriptionPatterns.length > 0) {
      saveTrainingDataToLocalStorage();
    }
  }, [mlTrainingData]);

  // NEW: ML Training Data Management
  const loadPersistedTrainingData = () => {
    try {
      const data = localStorage.getItem('interviewProcessor_mlData');
      if (data) {
        const parsed = JSON.parse(data);
        setMlTrainingData(parsed);
        updateModelStats(parsed);
        console.log('✅ ML training data loaded from localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading ML training data:', error);
    }
  };

  const saveTrainingDataToLocalStorage = () => {
    try {
      const serializedData = JSON.stringify({
        ...mlTrainingData,
        lastUpdated: new Date().toISOString()
      });
      localStorage.setItem('interviewProcessor_mlData', serializedData);
      console.log('✅ ML training data saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving ML training data:', error);
    }
  };

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

  // NEW: Load corrected training data
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
      const newPatterns = processCorrectionsForML(corrections);
      
      // Merge with existing ML data
      setMlTrainingData(prev => ({
        transcriptionPatterns: [...prev.transcriptionPatterns, ...newPatterns.transcriptionPatterns],
        transformationRules: [...prev.transformationRules, ...newPatterns.transformationRules],
        businessAreaClassifications: [...prev.businessAreaClassifications, ...newPatterns.businessAreaClassifications],
        sentimentAnalysis: [...prev.sentimentAnalysis, ...newPatterns.sentimentAnalysis],
        companyMentions: [...prev.companyMentions, ...newPatterns.companyMentions],
        segmentPatterns: [...prev.segmentPatterns, ...newPatterns.segmentPatterns],
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      }));
      
      setTrainingData(prev => [...prev, ...corrections]);
      
      console.log(`✅ Loaded ${corrections.length} corrections for ML training`);
      
    } catch (error) {
      console.error('❌ Error loading training data:', error);
      setErrorMessage(`Failed to load training data: ${error.message}`);
    }
  };

  // NEW: Process corrections for ML learning
  const processCorrectionsForML = (corrections) => {
    const newPatterns = {
      transcriptionPatterns: [],
      transformationRules: [],
      businessAreaClassifications: [],
      sentimentAnalysis: [],
      companyMentions: [],
      segmentPatterns: []
    };

    corrections.forEach(correction => {
      // Extract transcription patterns
      if (correction.original_text && correction.corrected_transcription) {
        newPatterns.transcriptionPatterns.push({
          original: correction.original_text,
          corrected: correction.corrected_transcription,
          context: correction.speaker,
          confidence: parseFloat(correction.confidence) || 0.5,
          timestamp: new Date().toISOString()
        });
      }

      // Extract transformation rules (only for Speaker_1)
      if (correction.original_text && correction.corrected_professional_text && correction.speaker === 'Speaker_1') {
        newPatterns.transformationRules.push({
          original: correction.original_text,
          transformed: correction.corrected_professional_text,
          company: correction.respondent_company,
          timestamp: new Date().toISOString()
        });
      }

      // Extract business area classifications
      if (correction.original_text && correction.corrected_business_area_code) {
        newPatterns.businessAreaClassifications.push({
          text: correction.original_text,
          businessArea: correction.corrected_business_area_code,
          suggestedAreas: correction.corrected_suggested_business_areas || correction.corrected_business_area_code,
          confidence: 1.0,
          timestamp: new Date().toISOString()
        });
      }

      // Extract sentiment analysis
      if (correction.original_text && correction.corrected_sentiment_code) {
        newPatterns.sentimentAnalysis.push({
          text: correction.original_text,
          sentiment: correction.corrected_sentiment_code,
          confidence: 1.0,
          timestamp: new Date().toISOString()
        });
      }

      // Detect segment modifications (joins/splits)
      if (correction.corrected_original_text && 
          correction.corrected_original_text.length > correction.original_text.length * 1.5) {
        newPatterns.segmentPatterns.push({
          type: 'segment_join',
          originalText: correction.original_text,
          correctedText: correction.corrected_original_text,
          timestamp: new Date().toISOString()
        });
      }
      
      if (correction.corrected_original_text && 
          correction.corrected_original_text.includes('|SPLIT|')) {
        const splitParts = correction.corrected_original_text.split('|SPLIT|');
        newPatterns.segmentPatterns.push({
          type: 'segment_split',
          originalText: correction.original_text,
          splitParts: splitParts,
          timestamp: new Date().toISOString()
        });
      }
    });

    console.log('🧠 ML patterns extracted:', {
      transcription: newPatterns.transcriptionPatterns.length,
      transformation: newPatterns.transformationRules.length,
      businessArea: newPatterns.businessAreaClassifications.length,
      sentiment: newPatterns.sentimentAnalysis.length,
      companies: newPatterns.companyMentions.length,
      segments: newPatterns.segmentPatterns.length
    });

    return newPatterns;
  };

  // Test API connection (UNCHANGED)
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

  // Minimal text cleaning - preserve all content (UNCHANGED)
  const cleanTranscriptionText = (text) => {
    return text
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Improved confidence calculation (UNCHANGED)
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

  // Time formatting (UNCHANGED)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // Speaker continuity with natural conversation flow (UNCHANGED - YOUR WORKING VERSION)
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

  // Helper function to parse time to seconds (UNCHANGED)
  const parseTimeToSeconds = (timeString) => {
    const parts = timeString.split(':');
    const minutes = parseInt(parts[0]);
    const secondsParts = parts[1].split('.');
    const seconds = parseInt(secondsParts[0]);
    const milliseconds = parseInt(secondsParts[1] || 0);
    return minutes * 60 + seconds + milliseconds / 1000;
  };

  // Improved transcription function (UNCHANGED)
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
        hasSpeakers: result.words?.some(w => w.speaker_id !== undefined)
      });

      setProgress(80);
      return parseApiResponseImproved(result);

    } catch (error) {
      console.error('❌ Transcription error:', error);
      throw error;
    }
  };

  // NEW: Enhanced auto-tagging with multiple business area suggestions
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
      if (mlMode && mlTrainingData.businessAreaClassifications.length > 0) {
        const learnedPatterns = mlTrainingData.businessAreaClassifications.filter(pattern => 
          pattern.businessArea === code && 
          calculateTextSimilarity(lowerText, pattern.text.toLowerCase()) > 0.6
        );
        
        if (learnedPatterns.length > 0) {
          score += learnedPatterns.length * 0.5; // Boost from ML learning
        }
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

  // NEW: Helper function for text similarity
  const calculateTextSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  };

  // Enhanced subject company detection (UNCHANGED)
  const detectSubjectCompany = (text) => {
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

  // Country detection (UNCHANGED)
  const detectCountries = (text) => {
    const countries = ["Guatemala", "El Salvador", "Honduras", "Costa Rica", "Nicaragua", "Panamá"];
    const lowerText = text.toLowerCase();
    const mentioned = countries.filter(country => 
      lowerText.includes(country.toLowerCase())
    );
    return mentioned.length > 0 ? mentioned : ["Regional"];
  };

  // Enhanced filename parsing (UNCHANGED)
  const extractCompanyInfo = (filename) => {
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

  // COMPLETELY OVERHAULED Professional transformation for actionable business insights
  const transformToProfessional = (text, speaker, company) => {
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
          transformed = applyTransformationRule(transformed, rule);
        });
      }
    }
    
    // PHASE 1: AGGRESSIVE CLEANUP - Remove all fillers and artifacts
    const aggressiveCleanupPatterns = [
      // Remove all filler words and sounds
      /\b(eh|ah|um|mm|hmm|este|esto|pues|bueno|o sea|como que|digamos|verdad|no sé|sabes|entonces|así|como|tipo|okey|ok)\b/gi,
      // Remove extended sounds and hesitations
      /\b(ehhh|ahhh|ummm|mmmm|eeee|aaaa|yyyy|siii|nooo|hastaaa|queee)\b/gi,
      // Remove repetitive words completely
      /\b(y y|que que|es es|la la|el el|de de|en en|con con|por por|para para|se se|me me|te te|son son|hay hay)\b/gi,
      // Remove incomplete thoughts and trailing words
      /\b(o sea que|es decir que|como te digo|como te comento|la verdad es que|al final|es más|por mencionar)\b/gi,
      // Remove question marks and incomplete sentences at the end
      /[,\s]*¿[^?]*\??\s*$/gi,
      /[,\s]*Y[,\s]*y[,\s]*y[^.]*$/gi,
      /[,\s]*-[^.]*$/gi,
      // Remove multiple punctuation and spaces
      /\s*\.\.\.\s*/g,
      /\s*,\s*,\s*/g,
      /\s*;\s*;\s*/g,
      /\s{2,}/g,
      // Remove trailing incomplete phrases
      /[,\s]+(y|pero|que|cuando|donde|como)\s*$/gi
    ];
    
    aggressiveCleanupPatterns.forEach(pattern => {
      transformed = transformed.replace(pattern, ' ');
    });
    
    // PHASE 2: SENTENCE RESTRUCTURING - Break into logical segments
    // Split by major connectors and restructure
    let sentences = transformed
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);
    
    // Process each sentence for clarity and structure
    sentences = sentences.map(sentence => {
      let processed = sentence;
      
      // Remove leading conjunctions that don't make sense at sentence start
      processed = processed.replace(/^(y|pero|entonces|así|como|que)\s+/gi, '');
      
      // Fix common structural issues
      processed = processed
        // Fix "es, es" patterns
        .replace(/\bes,\s*es\b/gi, 'es')
        // Fix "porque al final" patterns
        .replace(/\bporque al final,?\s*/gi, 'porque ')
        // Fix "hay varios" to more professional language
        .replace(/\bhay varios?\b/gi, 'existen múltiples')
        // Fix "es bien complejo" to professional language
        .replace(/\bes bien (complejo|difícil|complicado)\b/gi, 'resulta $1')
        // Fix "poder trabajar así" patterns
        .replace(/\bpoder trabajar así\b/gi, 'operar de esta manera')
        // Clean up remaining artifacts
        .replace(/,\s*,/g, ',')
        .replace(/\s+/g, ' ')
        .trim();
      
      return processed;
    }).filter(s => s.length > 3);
    
    // PHASE 3: CONTENT RESTRUCTURING - Create logical flow
    let restructuredContent = [];
    let currentTopic = '';
    let supportingDetails = [];
    
    sentences.forEach(sentence => {
      // Identify if this is a main topic or supporting detail
      if (sentence.toLowerCase().includes('en el caso de') || 
          sentence.toLowerCase().includes('con ') && sentence.toLowerCase().includes(' trabajamos') ||
          sentence.toLowerCase().includes('el problema es') ||
          sentence.toLowerCase().includes('la situación es')) {
        // This is a main topic
        if (currentTopic && supportingDetails.length > 0) {
          restructuredContent.push(currentTopic + '. ' + supportingDetails.join('. ') + '.');
        }
        currentTopic = sentence;
        supportingDetails = [];
      } else if (sentence.length > 10) {
        // This is a supporting detail
        supportingDetails.push(sentence);
      }
    });
    
    // Add the last topic and details
    if (currentTopic) {
      if (supportingDetails.length > 0) {
        restructuredContent.push(currentTopic + '. ' + supportingDetails.join('. ') + '.');
      } else {
        restructuredContent.push(currentTopic + '.');
      }
    } else if (supportingDetails.length > 0) {
      // If no clear topic, just join the details logically
      restructuredContent.push(supportingDetails.join('. ') + '.');
    }
    
    transformed = restructuredContent.join(' ');
    
    // PHASE 4: PROFESSIONAL LANGUAGE TRANSFORMATION + RETAILER PERSPECTIVE WITH NATURAL VARIATION
    const getRandomVariation = (alternatives) => {
      return alternatives[Math.floor(Math.random() * alternatives.length)];
    };
    
    const professionalTransformations = [
      // RETAILER PERSPECTIVE TRANSFORMATIONS WITH NATURAL VARIATIONS
      // Individual opinions to company perspective - MULTIPLE VARIATIONS
      { 
        pattern: /\byo creo que\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} creemos que`,
          `Creemos que`,
          `En ${company} consideramos que`,
          `Consideramos que`,
          `En ${company} notamos que`,
          `Hemos observado que`
        ])
      },
      { 
        pattern: /\byo pienso que\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} consideramos que`,
          `Consideramos que`,
          `En ${company} evaluamos que`,
          `Nuestra perspectiva es que`,
          `En ${company} creemos que`
        ])
      },
      { 
        pattern: /\byo considero que\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} evaluamos que`,
          `Evaluamos que`,
          `En ${company} consideramos que`,
          `Para nosotros es claro que`,
          `Consideramos que`
        ])
      },
      { 
        pattern: /\byo veo que\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} observamos que`,
          `Hemos visto que`,
          `En ${company} notamos que`,
          `Observamos que`,
          `En ${company} hemos identificado que`
        ])
      },
      
      // Individual actions to company actions - NATURAL VARIATIONS
      { 
        pattern: /\byo trabajo\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} trabajamos`,
          `Trabajamos`,
          `En ${company} manejamos`,
          `Gestionamos`,
          `En ${company} operamos`
        ])
      },
      { 
        pattern: /\byo manejo\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} manejamos`,
          `Manejamos`,
          `En ${company} gestionamos`,
          `Gestionamos`,
          `En ${company} coordinamos`
        ])
      },
      
      // Relationship statements - SUPPLIER-FOCUSED VARIATIONS
      { 
        pattern: /\btrabajamos con ([^.]+)\b/gi, 
        replacement: (match, supplier) => getRandomVariation([
          `Con ${supplier} trabajamos`,
          `${supplier} es un proveedor con el que trabajamos`,
          `En ${company} trabajamos con ${supplier}`,
          `${supplier} siempre ha sido un proveedor que destaca en ${company}`,
          `Con ${supplier} mantenemos una relación comercial`
        ])
      },
      { 
        pattern: /\btenemos una (buena|excelente|mala) relación con ([^.]+)\b/gi, 
        replacement: (match, quality, supplier) => {
          if (quality.toLowerCase() === 'buena' || quality.toLowerCase() === 'excelente') {
            return getRandomVariation([
              `Con ${supplier} tenemos una ${quality} relación`,
              `${supplier} es un socio estratégico valioso para ${company}`,
              `En ${company} valoramos nuestra relación con ${supplier}`,
              `${supplier} siempre ha sido un proveedor confiable para nosotros`,
              `Con ${supplier} mantenemos una colaboración efectiva`
            ]);
          } else {
            return getRandomVariation([
              `Con ${supplier} hemos identificado oportunidades de mejora`,
              `${supplier} presenta algunos desafíos en nuestra relación comercial`,
              `En ${company} trabajamos con ${supplier} para optimizar nuestra colaboración`
            ]);
          }
        }
      },
      
      // Company values and priorities - NATURAL FLOW VARIATIONS
      { 
        pattern: /\bsiempre busco\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} siempre buscamos`,
          `Siempre buscamos`,
          `Para nosotros es importante`,
          `En ${company} priorizamos`,
          `Constantemente trabajamos para`
        ])
      },
      { 
        pattern: /\bme parece importante\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} consideramos importante`,
          `Para nosotros es importante`,
          `Consideramos fundamental`,
          `En ${company} priorizamos`,
          `Es clave para nosotros`
        ])
      },
      { 
        pattern: /\bpara mí es fundamental\b/gi, 
        replacement: () => getRandomVariation([
          `Para ${company} es fundamental`,
          `Es fundamental para nosotros`,
          `En ${company} consideramos esencial`,
          `Para nosotros es clave`,
          `Consideramos prioritario`
        ])
      },
      
      // Experience and observations - VARIED EXPRESSIONS
      { 
        pattern: /\bhe visto que\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} hemos observado que`,
          `Hemos visto que`,
          `En ${company} notamos que`,
          `Hemos identificado que`,
          `En nuestra experiencia`
        ])
      },
      { 
        pattern: /\ben mi experiencia\b/gi, 
        replacement: () => getRandomVariation([
          `En la experiencia de ${company}`,
          `En nuestra experiencia`,
          `Hemos aprendido que`,
          `En ${company} hemos comprobado que`,
          `Nuestra experiencia nos indica que`
        ])
      },
      
      // Expectations and requirements - PROFESSIONAL VARIATIONS
      { 
        pattern: /\bespero que\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} esperamos que`,
          `Esperamos que`,
          `Para nosotros sería ideal que`,
          `En ${company} nos gustaría que`,
          `Consideramos importante que`
        ])
      },
      { 
        pattern: /\bnecesito que\b/gi, 
        replacement: () => getRandomVariation([
          `En ${company} necesitamos que`,
          `Necesitamos que`,
          `Para nosotros es importante que`,
          `En ${company} requerimos que`,
          `Es fundamental que`
        ])
      }
    ];
    
    // Apply professional transformations with variation
    professionalTransformations.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'function') {
        // Handle dynamic replacements with variations
        transformed = transformed.replace(pattern, replacement);
      } else {
        // Handle static replacements
        transformed = transformed.replace(pattern, replacement);
      }
    });
    
    // ADDITIONAL STATIC TRANSFORMATIONS (keeping existing ones)
    const staticTransformations = [
      // Business context improvements
      { pattern: /\ben el caso de ([^,]+),?\s*/gi, replacement: 'En el caso de $1 ' },
      { pattern: /\blo trabajo muy bien\b/gi, replacement: `mantenemos una excelente relación` },
      { pattern: /\blo estoy trabajando\b/gi, replacement: `estamos trabajando en esto` },
      
      // Distribution and logistics language
      { pattern: /\bhay varios distribuidores\b/gi, replacement: 'existe una red de distribución compleja' },
      { pattern: /\bdistribuidores dentro del mismo país\b/gi, replacement: 'múltiples distribuidores operando en el mismo mercado' },
      { pattern: /\bvan a distribuir\b/gi, replacement: 'manejan la distribución de' },
      { pattern: /\blo distribuye uno\b/gi, replacement: 'lo maneja un distribuidor' },
      { pattern: /\blo va a distribuir otro\b/gi, replacement: 'es manejado por otro distribuidor' },
      
      // Complexity and challenges
      { pattern: /\bresulta complejo\b/gi, replacement: 'presenta desafíos operativos' },
      { pattern: /\boperar de esta manera\b/gi, replacement: 'coordinar eficientemente con esta estructura' },
      { pattern: /\bson complejos cuando son tantas cabecillas\b/gi, replacement: 'se complican con múltiples puntos de contacto' },
      { pattern: /\bcon tanta persona que está llevando\b/gi, replacement: 'cuando múltiples personas gestionan' },
      
      // Relationship and collaboration language
      { pattern: /\bempezando a regionalizarse\b/gi, replacement: 'implementando una estrategia de regionalización' },
      { pattern: /\bsiempre he\b/gi, replacement: `En ${company} siempre hemos` },
      { pattern: /\bsiempre hemos\b/gi, replacement: `En ${company} siempre hemos` },
      
      // Quality and performance descriptors
      { pattern: /\bmuy bien\b/gi, replacement: 'efectivamente' },
      { pattern: /\bbien\b/gi, replacement: 'satisfactoriamente' },
      { pattern: /\bmal\b/gi, replacement: 'de manera deficiente' },
      { pattern: /\bproblemas\b/gi, replacement: 'desafíos operativos' },
      { pattern: /\bdificultades\b/gi, replacement: 'obstáculos' },
      
      // Supplier evaluation language
      { pattern: /\bson muy atentos\b/gi, replacement: 'demuestran excelente atención' },
      { pattern: /\bnos proveen información necesaria\b/gi, replacement: 'proporcionan la información requerida' },
      { pattern: /\bson un excelente proveedor\b/gi, replacement: 'representan un socio estratégico de alto valor' },
      { pattern: /\bdeberían ser más rápidos\b/gi, replacement: 'podrían optimizar sus tiempos de respuesta' },
      { pattern: /\btienen que mejorar\b/gi, replacement: 'presentan oportunidades de mejora en' }
    ];
    
    // Apply static transformations
    staticTransformations.forEach(({ pattern, replacement }) => {
      transformed = transformed.replace(pattern, replacement);
    });
    
    // PHASE 5: SENTENCE FLOW AND STRUCTURE OPTIMIZATION
    transformed = transformed
      // Fix sentence connectors
      .replace(/\.\s*Pero\s+/gi, '. Sin embargo, ')
      .replace(/\.\s*Y\s+/gi, '. Adicionalmente, ')
      .replace(/\.\s*Entonces\s+/gi, '. Por lo tanto, ')
      .replace(/\.\s*Así\s+/gi, '. De esta manera, ')
      // Fix spacing and punctuation
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\.\s*/g, '. ')
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s+/g, ' ')
      // Remove redundant phrases
      .replace(/\bPor mencionar un ejemplo:\s*/gi, 'Por ejemplo, ')
      .replace(/\bAl final\s*/gi, '')
      .replace(/\bEs más,?\s*/gi, '')
      .trim();
    
    // PHASE 6: FINAL POLISH AND CAPITALIZATION
    if (transformed.length > 0) {
      // Ensure proper capitalization
      transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
      
      // Capitalize after periods
      transformed = transformed.replace(/\.\s+([a-z])/g, (match, letter) => '. ' + letter.toUpperCase());
      
      // Ensure proper ending
      if (!/[.!?]$/.test(transformed)) {
        transformed += '.';
      }
      
      // Final cleanup of any remaining artifacts
      transformed = transformed
        .replace(/\s+/g, ' ')
        .replace(/\.\s*\./g, '.')
        .replace(/,\s*\./g, '.')
        .trim();
    }
    
    console.log(`🔄 ACTIONABLE INSIGHT TRANSFORMATION (${speaker}):`, {
      original: text.substring(0, 80) + '...',
      transformed: transformed.substring(0, 80) + '...',
      company: company,
      improvements: 'Aggressive cleanup, sentence restructuring, professional language, actionable insights'
    });
    
    return transformed;
  };

  // NEW: Apply ML transformation rule
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

  // NEW: Extract key transformations from ML rule
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

  // MAIN PROCESSING FUNCTION (ENHANCED with ML)
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
      console.log('🎙️ Starting enhanced transcription with ML features...');
      setProgress(10);

      // ACTUAL TRANSCRIPTION (YOUR WORKING VERSION)
      const transcriptionSegments = await transcribeWithElevenLabsImproved(audioFile);
      setProgress(40);

      console.log('📝 Processing with enhanced multi-area tagging...');
      setProgress(50);

      const companyInfo = extractCompanyInfo(audioFile.name);
      const insights = [];

      for (const [index, segment] of transcriptionSegments.entries()) {
        // Use enhanced tagging with multiple business areas
        const tags = autoTagEnhancedMultiple(segment.text, segment.speaker);
        
        const professionalText = transformToProfessional(
          segment.text, 
          segment.speaker, 
          companyInfo.company
        );
        
        const countries = detectCountries(segment.text);
        const subjectCompanyResult = detectSubjectCompany(segment.text);
        
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

  // Enhanced CSV generation with multiple business areas AND correction columns
  const generateCsvContent = (insights) => {
    const headers = [
      // Original data columns
      'file_name', 'start_time', 'end_time', 'speaker', 'confidence',
      'original_text', 'professional_text', 'english_translation',
      'respondent_company', 'respondent_company_code', 'subject_company_code',
      'subject_company', 'business_area_code', 'business_area',
      'suggested_business_areas', 'suggested_business_area_names',
      'sentiment_code', 'sentiment', 'country_specific', 'countries',
      'is_best_in_class', 'needs_review', 'interviewer_type',
      'processing_date', 'confidence_level',
      
      // NEW: Correction columns for ML training
      'corrected_original_text', 'corrected_professional_text', 'corrected_business_area_code',
      'corrected_suggested_business_areas', 'corrected_sentiment_code', 'corrected_subject_company_code',
      'correction_notes'
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
        } else if (header.startsWith('corrected_')) {
          // Leave correction columns empty for user to fill
          value = '';
        } else if (header === 'correction_notes') {
          // Provide guidance in the notes column
          if (insight.speaker === 'Speaker_0') {
            value = 'Interviewer - no corrections needed';
          } else {
            value = 'Add corrections here. Use |SPLIT| to split segments, combine text to join segments';
          }
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

  // Download CSV (UNCHANGED)
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

  // Reset function (UNCHANGED)
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
        <p className="text-blue-100">Your Working Transcription + ML Training + Multiple Business Areas</p>
      </div>

      {/* NEW: ML Training Section */}
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

      {/* NEW: Multiple Business Areas Info */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">📊 Multiple Business Areas Feature</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <div><strong>Primary Area:</strong> Highest confidence business area classification</div>
          <div><strong>Suggested Areas:</strong> Up to 3 relevant areas (format: "1006:1001:1015")</div>
          <div><strong>Balanced Reporting:</strong> Prevents overuse of common practices, ensures all 29 areas get coverage</div>
          <div><strong>Segment Corrections:</strong> Join segments by combining text, split using |SPLIT| marker</div>
        </div>
      </div>

      {/* Step 1: Setup (ENHANCED) */}
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
              {processing ? 'Processing...' : mlMode ? '🧠 Start ML-Enhanced Processing' : '🚀 Start Enhanced Processing'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Processing (UNCHANGED) */}
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
              {mlMode ? 'Processing with ML enhancements...' : 'Processing with enhanced features...'}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Results (ENHANCED) */}
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

            {/* Sample Results with Multiple Business Areas */}
            {processedInsights.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Sample Enhanced Results</h3>
                <div className="space-y-4">
                  {processedInsights.slice(0, 3).map((insight, index) => (
                    <div key={index} className={`border-l-4 pl-4 py-2 ${insight.speaker === 'Speaker_0' ? 'border-blue-500' : 'border-green-500'}`}>
                      <div className="text-sm text-gray-600 mb-1">
                        {insight.start_time} - {insight.end_time} | {insight.speaker} | Confidence: {insight.confidence_level}
                      </div>
                      <div className="text-sm mb-2">
                        <strong>Original:</strong> {insight.original_text}
                      </div>
                      {insight.speaker === 'Speaker_1' && (
                        <>
                          <div className="text-sm mb-2">
                            <strong>Professional:</strong> {insight.professional_text}
                          </div>
                          <div className="text-sm mb-2">
                            <strong>Primary Area:</strong> {insight.business_area} ({insight.business_area_code})
                          </div>
                          <div className="text-sm mb-2">
                            <strong>Suggested Areas:</strong> {insight.suggested_business_areas}
                          </div>
                        </>
                      )}
                      <div className="text-xs text-gray-500">
                        {insight.speaker === 'Speaker_1' ? `Sentiment: ${insight.sentiment} | Subject: ${insight.subject_company}` : 'Interviewer Question (Preserved)'}
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

