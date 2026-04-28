import os
import shutil

source_dir = r"D:\Proyectos IA\Cuentos de Efraín Concordancia y Aventuras Bíblicas\Personajes y ModelSheets"
target_dir = r"D:\Proyectos IA\Cuentos de Efraín Concordancia y Aventuras Bíblicas\efrain-app\public\characters"

if not os.path.exists(target_dir):
    os.makedirs(target_dir)

# Mapping of folder names to preferred characters
# We look for files that don't have "MODELSHEET" in the name if possible
for folder in os.listdir(source_dir):
    folder_path = os.path.join(source_dir, folder)
    if os.path.isdir(folder_path):
        files = [f for f in os.listdir(folder_path) if f.endswith('.png')]
        if not files:
            continue
            
        # Prioritize files without "MODELSHEET" in the name
        main_files = [f for f in files if "MODELSHEET" not in f.upper()]
        
        if main_files:
            # Use the first one found
            src_file = os.path.join(folder_path, main_files[0])
            dest_name = folder.lower().replace("-", "_") + ".png"
            dest_path = os.path.join(target_dir, dest_name)
            shutil.copy2(src_file, dest_path)
            print(f"Copied {src_file} to {dest_path}")
        elif files:
            # Fallback to any png if no non-modelsheet found
            src_file = os.path.join(folder_path, files[0])
            dest_name = folder.lower().replace("-", "_") + ".png"
            dest_path = os.path.join(target_dir, dest_name)
            shutil.copy2(src_file, dest_path)
            print(f"Copied (fallback) {src_file} to {dest_path}")
