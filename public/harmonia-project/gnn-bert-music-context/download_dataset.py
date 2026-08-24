import kagglehub
import os

# Define the path to download the dataset
# This will create 'data/raw' inside the current directory
download_path = os.path.join(os.getcwd(), 'data', 'raw')

print(f"Downloading GTZAN dataset to: {download_path}")

# Download and unzip the dataset to the specified path
path = kagglehub.dataset_download(
    "andradaolteanu/gtzan-dataset-music-genre-classification",
    path=download_path
)

print("Dataset downloaded successfully to:", path)
print("\nNext step: Modify dataset.py to load the data.")
