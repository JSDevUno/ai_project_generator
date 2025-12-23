export interface ProjectTemplate {
  requiredFiles: string[];
  structure: Record<string, string[]>;
  dependencies: string[];
}

export interface ProjectTemplates {
  [key: string]: ProjectTemplate;
  computer_vision: ProjectTemplate;
  nlp: ProjectTemplate;
  general: ProjectTemplate;
}

export const PROJECT_TEMPLATES: ProjectTemplates = {
  computer_vision: {
    requiredFiles: [
      'src/data_loader.py',
      'src/transforms.py', 
      'src/model.py',
      'src/train.py',
      'src/evaluate.py',
      'src/inference.py',
      'configs/config.yaml',
      'requirements.txt',
      'README.md'
    ],
    structure: {
      'data/': ['raw/', 'processed/', 'splits/'],
      'src/': ['__init__.py', 'data/', 'models/', 'training/', 'evaluation/'],
      'configs/': ['config.yaml', 'hyperparams/'],
      'models/': ['checkpoints/', 'exported/'],
      'results/': ['logs/', 'plots/', 'reports/'],
      'deployment/': ['api.py', 'Dockerfile', 'requirements.txt']
    },
    dependencies: [
      'torch>=1.12.0',
      'torchvision>=0.13.0',
      'opencv-python>=4.5.0',
      'pillow>=9.0.0',
      'matplotlib>=3.5.0',
      'scikit-learn>=1.0.0'
    ]
  },
  
  nlp: {
    requiredFiles: [
      'src/text_processor.py',
      'src/tokenizer.py',
      'src/model.py', 
      'src/train.py',
      'src/evaluate.py',
      'src/inference.py',
      'configs/config.yaml',
      'requirements.txt',
      'README.md'
    ],
    structure: {
      'data/': ['raw/', 'processed/', 'embeddings/'],
      'src/': ['__init__.py', 'preprocessing/', 'models/', 'training/'],
      'models/': ['pretrained/', 'fine_tuned/', 'tokenizers/'],
      'deployment/': ['api.py', 'Dockerfile']
    },
    dependencies: [
      'transformers>=4.20.0',
      'torch>=1.12.0',
      'datasets>=2.0.0',
      'tokenizers>=0.12.0',
      'nltk>=3.7',
      'spacy>=3.4.0'
    ]
  },

  general: {
    requiredFiles: [
      'src/main.py',
      'src/config.py',
      'src/utils.py',
      'requirements.txt',
      'README.md'
    ],
    structure: {
      'src/': ['__init__.py'],
      'data/': [],
      'configs/': ['config.yaml'],
      'results/': []
    },
    dependencies: ['numpy', 'pandas', 'scikit-learn']
  }
};