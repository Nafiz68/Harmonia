# Harmonia

Harmonia is a web application designed for advanced music context understanding. It leverages a powerful GNN-BERT fusion model to analyze, classify, and retrieve music based on a variety of contextual cues. The platform provides an interactive interface to explore the relationships between music, tags, and textual descriptions.

## Features

*   **BERT Multi-Label Tag Classifier**: Classifies music with multiple descriptive tags.
*   **GraphSAGE on Chord/Segment Graphs**: Analyzes the structure of music using graph neural networks.
*   **GNN–BERT Fusion**: Combines the power of graph-based and sequence-based models for a deeper understanding of music.
*   **Contrastive Learning for Retrieval**: Enables searching for audio clips using natural language captions.
*   **Interactive Visualizations**: Explore music data and model results through an intuitive user interface.

## Tech Stack

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS
*   **Backend (ML)**: Python, PyTorch
*   **Database**: PGlite
*   **Authentication**: Better Auth

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Nafiz68/Harmonia.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd Harmonia
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

## Available Scripts

*   `npm run dev`: Starts the development server at `http://localhost:8080`.
*   `npm run build`: Builds the application for production.
*   `npm run test`: Runs the test suite.
*   `npm run lint`: Lints the codebase for potential errors.
*   `npm run format`: Formats the code using Prettier.

## Model Details

The core of this project is the GNN–BERT model. For a detailed explanation of the model architecture, datasets, and training process, please refer to the `README.md` in the model's subdirectory: [`public/harmonia-project/gnn-bert-music-context/README.md`](public/harmonia-project/gnn-bert-music-context/README.md).