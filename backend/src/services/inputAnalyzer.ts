export interface ProjectAnalysis {
  domain: string;
  complexity: 'low' | 'medium' | 'high';
  frameworks: string[];
  dataTypes: string[];
  deploymentNeeds: boolean;
  realTimeNeeds: boolean;
  scalabilityNeeds: boolean;
  suggestedModel: string;
}

export class InputAnalyzer {
  static analyze(instruction: string): ProjectAnalysis {
    const lower = instruction.toLowerCase();
    
    // Domain Detection
    let domain = 'general';
    if (this.isComputerVision(lower)) domain = 'computer_vision';
    else if (this.isNLP(lower)) domain = 'nlp';
    else if (this.isTimeSeries(lower)) domain = 'time_series';
    else if (this.isRecommendation(lower)) domain = 'recommendation';
    else if (this.isAudio(lower)) domain = 'audio';
    else if (this.isRL(lower)) domain = 'reinforcement_learning';
    
    // Complexity Assessment
    const complexity = this.assessComplexity(lower);
    
    // Framework Suggestions
    const frameworks = this.suggestFrameworks(domain, lower);
    
    // Data Type Detection
    const dataTypes = this.detectDataTypes(lower);
    
    // Deployment & Scale Detection
    const deploymentNeeds = this.needsDeployment(lower);
    const realTimeNeeds = this.needsRealTime(lower);
    const scalabilityNeeds = this.needsScalability(lower);
    
    // Model Suggestion
    const suggestedModel = this.suggestBestModel(domain, complexity);
    
    return {
      domain,
      complexity,
      frameworks,
      dataTypes,
      deploymentNeeds,
      realTimeNeeds,
      scalabilityNeeds,
      suggestedModel
    };
  }
  
  private static isComputerVision(text: string): boolean {
    const cvKeywords = [
      'image', 'vision', 'cnn', 'convolutional', 'object detection',
      'classification', 'segmentation', 'yolo', 'resnet', 'opencv',
      'photo', 'picture', 'visual', 'camera', 'video'
    ];
    return cvKeywords.some(keyword => text.includes(keyword));
  }
  
  private static isNLP(text: string): boolean {
    const nlpKeywords = [
      'text', 'language', 'nlp', 'transformer', 'bert', 'gpt',
      'sentiment', 'translation', 'chatbot', 'tokenization',
      'embedding', 'word', 'sentence', 'document'
    ];
    return nlpKeywords.some(keyword => text.includes(keyword));
  }
  
  private static isTimeSeries(text: string): boolean {
    const tsKeywords = [
      'time series', 'forecast', 'prediction', 'temporal', 'lstm',
      'sequence', 'trend', 'seasonal', 'stock', 'weather'
    ];
    return tsKeywords.some(keyword => text.includes(keyword));
  }
  
  private static isRecommendation(text: string): boolean {
    const recKeywords = [
      'recommendation', 'collaborative filtering', 'matrix factorization',
      'recommend', 'suggest', 'personalization', 'user preference'
    ];
    return recKeywords.some(keyword => text.includes(keyword));
  }
  
  private static isAudio(text: string): boolean {
    const audioKeywords = [
      'audio', 'sound', 'speech', 'music', 'voice', 'acoustic',
      'wav', 'mp3', 'spectrogram', 'mfcc'
    ];
    return audioKeywords.some(keyword => text.includes(keyword));
  }
  
  private static isRL(text: string): boolean {
    const rlKeywords = [
      'reinforcement learning', 'rl', 'agent', 'environment', 'reward',
      'policy', 'q-learning', 'dqn', 'game', 'control'
    ];
    return rlKeywords.some(keyword => text.includes(keyword));
  }
  
  private static assessComplexity(text: string): 'low' | 'medium' | 'high' {
    const highComplexity = [
      'multi-modal', 'ensemble', 'distributed', 'real-time', 'production',
      'scalable', 'microservices', 'kubernetes', 'advanced', 'complex',
      'transformer', 'bert', 'gpt', 'yolo', 'gan'
    ];
    
    const lowComplexity = [
      'simple', 'basic', 'beginner', 'tutorial', 'linear regression',
      'logistic regression', 'decision tree'
    ];
    
    if (highComplexity.some(keyword => text.includes(keyword))) return 'high';
    if (lowComplexity.some(keyword => text.includes(keyword))) return 'low';
    return 'medium';
  }
  
  private static suggestFrameworks(domain: string, text: string): string[] {
    const frameworks: Record<string, string[]> = {
      computer_vision: ['torch', 'torchvision', 'opencv-python', 'pillow', 'albumentations'],
      nlp: ['transformers', 'torch', 'tokenizers', 'datasets', 'nltk', 'spacy'],
      time_series: ['torch', 'pandas', 'numpy', 'scikit-learn', 'statsmodels'],
      audio: ['torch', 'torchaudio', 'librosa', 'soundfile'],
      reinforcement_learning: ['torch', 'gym', 'stable-baselines3'],
      general: ['scikit-learn', 'pandas', 'numpy']
    };
    
    return frameworks[domain] || frameworks.general;
  }
  
  private static detectDataTypes(text: string): string[] {
    const types = [];
    if (text.includes('image') || text.includes('photo')) types.push('images');
    if (text.includes('text') || text.includes('document')) types.push('text');
    if (text.includes('audio') || text.includes('sound')) types.push('audio');
    if (text.includes('video')) types.push('video');
    if (text.includes('csv') || text.includes('tabular')) types.push('tabular');
    return types.length > 0 ? types : ['general'];
  }
  
  private static needsDeployment(text: string): boolean {
    return ['api', 'deploy', 'production', 'serve', 'endpoint'].some(keyword => text.includes(keyword));
  }
  
  private static needsRealTime(text: string): boolean {
    return ['real-time', 'streaming', 'live', 'instant'].some(keyword => text.includes(keyword));
  }
  
  private static needsScalability(text: string): boolean {
    return ['scalable', 'distributed', 'cluster', 'kubernetes'].some(keyword => text.includes(keyword));
  }
  
  private static suggestBestModel(domain: string, complexity: string): string {
    const models: Record<string, Record<string, string>> = {
      computer_vision: {
        low: 'kwaipilot/kat-coder-pro:free',
        medium: 'openai/gpt-oss-120b:free', 
        high: 'openai/gpt-oss-120b'
      },
      nlp: {
        low: 'kwaipilot/kat-coder-pro:free',
        medium: 'openai/gpt-oss-120b:free',
        high: 'openai/gpt-oss-120b'
      }
    };
    
    return models[domain]?.[complexity] || 'kwaipilot/kat-coder-pro:free';
  }
}