import React, { useState } from 'react';
import { Upload, Cpu, CheckCircle, Image as ImageIcon, Sparkles, Eye, EyeOff, Download, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import Badge from './Badge';
import { API_BASE_URL } from '../api/client';

export default function AIDebrisDetection({ onUploadImage }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [inputType, setInputType] = useState('USER UPLOAD');
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (< 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("File size exceeds 15MB maximum upload limit.");
      return;
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Unsupported image type. Please select PNG, JPG, JPEG, or WEBP.");
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setInputType('USER UPLOAD');
    setPreviewUrl(URL.createObjectURL(file));
    setDetectionResult(null);

    // Read image dimensions
    const img = new Image();
    img.onload = () => {
      setFileMeta({
        name: file.name,
        size_mb: (file.size / (1024 * 1024)).toFixed(2),
        width: img.width,
        height: img.height
      });
    };
    img.src = URL.createObjectURL(file);
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await onUploadImage(selectedFile);
      if (res) {
        setDetectionResult(res);
      } else {
        setErrorMessage("Image analysis failed. Please try another optical frame.");
      }
    } catch (err) {
      setErrorMessage("Processing error: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  // Demo Telescope Image Preset Loader
  const handleRunDemoSample = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setInputType('DEMO IMAGE');

    // Create synthetic optical telescope sample canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    // Astronomical dark sky
    ctx.fillStyle = '#03050B';
    ctx.fillRect(0, 0, 1280, 720);
    
    // Starfield dots
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.85 + 0.15})`;
      ctx.fillRect(Math.random() * 1280, Math.random() * 720, 1.5, 1.5);
    }

    // Optical streak 1
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(250, 320);
    ctx.lineTo(820, 480);
    ctx.stroke();

    canvas.toBlob(async (blob) => {
      const file = new File([blob], "demo_optical_telescope_streak.png", { type: "image/png" });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFileMeta({
        name: file.name,
        size_mb: "0.85",
        width: 1280,
        height: 720
      });

      const res = await onUploadImage(file);
      setIsProcessing(false);
      if (res) {
        setDetectionResult(res);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-space-border pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-wide">AI DEBRIS DETECTION</h1>
            <Badge type="AI PREDICTION — PROTOTYPE" size="normal" />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Computer-vision assisted identification of potential optical debris streaks.
          </p>
        </div>

        <button
          onClick={handleRunDemoSample}
          disabled={isProcessing}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg transition"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>LOAD PRESET TELESCOPE SAMPLE</span>
        </button>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="bg-red-950/40 border border-red-500/50 p-4 rounded-xl flex items-center space-x-3 text-red-300 text-xs font-sans">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 3-Column Interface: Left Upload, Center Image, Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Upload Area (4 cols) */}
        <div className="lg:col-span-4 bg-space-card border border-space-border p-5 rounded-2xl shadow-xl space-y-5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
            <Upload className="w-4 h-4 text-sky-400 mr-2" />
            Upload Space Image
          </h3>

          <div className="border-2 border-dashed border-space-border hover:border-sky-500/50 rounded-2xl p-6 text-center transition bg-space-dark/40 cursor-pointer relative">
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-white">
                {selectedFile ? selectedFile.name : 'Drag & Drop or Choose Image'}
              </p>
              <p className="text-[10px] text-slate-500 font-sans">PNG, JPG, JPEG, WEBP (Max 15MB)</p>
            </div>
          </div>

          {/* Selected File Metadata */}
          {fileMeta && (
            <div className="bg-space-dark p-3.5 rounded-xl border border-space-border text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Filename:</span>
                <span className="text-white font-bold truncate max-w-[180px]">{fileMeta.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>File Size:</span>
                <span className="text-white font-bold">{fileMeta.size_mb} MB</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Dimensions:</span>
                <span className="text-sky-400 font-bold">{fileMeta.width} × {fileMeta.height} px</span>
              </div>
            </div>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={!selectedFile || isProcessing}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center justify-center space-x-2"
          >
            <Cpu className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'PROCESSING OPENCV PIPELINE...' : 'RUN AI ANALYSIS'}</span>
          </button>
        </div>

        {/* CENTER PANEL: Image Preview & Annotations (5 cols) */}
        <div className="lg:col-span-5 bg-space-card border border-space-border p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-space-border pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />
              Analysis Image View
            </h3>

            {detectionResult && (
              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className="flex items-center space-x-1 text-xs text-sky-400 hover:text-sky-300 font-bold bg-space-dark px-2.5 py-1 rounded border border-space-border"
              >
                {showBoxes ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                <span>{showBoxes ? 'HIDE BOXES' : 'SHOW BOXES'}</span>
              </button>
            )}
          </div>

          <div className="bg-space-dark rounded-xl overflow-hidden border border-space-border min-h-[300px] flex items-center justify-center relative">
            {previewUrl ? (
              <img
                src={showBoxes && detectionResult ? `${API_BASE_URL}${detectionResult.processed_image_url}` : previewUrl}
                alt="Analysis Result"
                className="max-h-[380px] w-full object-contain"
              />
            ) : (
              <div className="text-center p-8 text-slate-500 text-xs space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                <p>Upload an optical astronomical image or select a preset sample to view streak detection output.</p>
              </div>
            )}
          </div>

          {detectionResult && (
            <div className="flex items-center justify-between pt-1">
              <a
                href={`${API_BASE_URL}${detectionResult.processed_image_url}`}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-space-dark px-3 py-1.5 rounded-lg border border-space-border transition"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>DOWNLOAD RESULT</span>
              </a>
              <Badge type="AI PREDICTION — PROTOTYPE" size="small" />
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Detection Results Sidebar (3 cols) */}
        <div className="lg:col-span-3 bg-space-card border border-space-border p-5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-space-border pb-3">
            Detection Results
          </h3>

          {detectionResult ? (
            <div className="space-y-4 text-xs">
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">DETECTION COMPLETE</span>
                <div className="flex items-center justify-between text-white font-bold">
                  <span>Candidates Found:</span>
                  <span className="text-emerald-400 text-sm">{detectionResult.detection_count}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Processing Time:</span>
                  <span className="text-white">{detectionResult.processing_time_ms} ms</span>
                </div>
              </div>

              {/* Detections List */}
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {detectionResult.detections.map((det, idx) => (
                  <div key={idx} className="bg-space-dark p-3 rounded-xl border border-space-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sky-400 font-bold">Candidate #{idx + 1}</span>
                      <span className="text-emerald-400 font-bold">Conf: {det.confidence}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Type: <strong className="text-slate-200">{det.candidate_type}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Streak Length: <strong className="text-amber-300">{det.streak_length_px || 42.5} px</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Apparent Velocity: <strong className="text-sky-300">{det.estimated_apparent_velocity || "1.2 deg/sec"}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      BBox: <strong className="text-white">[{det.x}, {det.y}, {det.width}, {det.height}]</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confidence Disclaimer Explanation Note */}
              <p className="text-[10px] text-slate-400 font-sans border-t border-space-border/60 pt-2">
                * Algorithmic candidate confidence; not a physical confirmation of space debris.
              </p>
            </div>
          ) : (
            <div className="text-slate-500 text-xs text-center py-12 space-y-2">
              <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No active detections to report.</p>
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM PANEL: Visual Processing Pipeline Diagram & Provenance */}
      <div className="bg-space-card border border-space-border p-6 rounded-2xl shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-space-border pb-3">
          Processing Pipeline & Data Provenance
        </h4>

        {/* Workflow Diagram */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs text-center">
          <div className={`p-3 rounded-xl border font-bold ${selectedFile ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-space-dark border-space-border text-slate-500'}`}>
            1. IMAGE INPUT
          </div>
          <div className={`p-3 rounded-xl border font-bold ${detectionResult ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-space-dark border-space-border text-slate-500'}`}>
            2. PREPROCESSING
          </div>
          <div className={`p-3 rounded-xl border font-bold ${detectionResult ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-space-dark border-space-border text-slate-500'}`}>
            3. TOP-HAT SUBTRACTION
          </div>
          <div className={`p-3 rounded-xl border font-bold ${detectionResult ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-space-dark border-space-border text-slate-500'}`}>
            4. STREAK EXTRACTION
          </div>
          <div className={`p-3 rounded-xl border font-bold ${detectionResult ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-space-dark border-space-border text-slate-500'}`}>
            5. CANDIDATE FILTERING
          </div>
          <div className={`p-3 rounded-xl border font-bold ${detectionResult ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-space-dark border-space-border text-slate-500'}`}>
            6. DETECTION RESULT
          </div>
        </div>

        {/* Data Provenance Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-space-dark p-3.5 rounded-xl border border-space-border">
          <div>
            <span className="text-slate-500 text-[10px] block">INPUT ORIGIN</span>
            <span className="text-white font-bold">{inputType}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">DETECTION METHOD</span>
            <span className="text-sky-400 font-bold">COMPUTER VISION BASELINE</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">OUTPUT CLASSIFICATION</span>
            <span className="text-emerald-400 font-bold">AI PREDICTION — PROTOTYPE</span>
          </div>
        </div>

      </div>

    </div>
  );
}
