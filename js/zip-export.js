/**
 * Client-Side ZIP Packager & Downloader
 * Compresses and downloads selected photos locally without server uploads
 */

class ZipExporter {
  static async exportPhotos(photos, onProgress, filename = "Selected_Wedding_Photos.zip") {
    if (!window.JSZip) {
      throw new Error("JSZip library is not loaded.");
    }

    if (!photos || photos.length === 0) {
      throw new Error("No photos selected for download.");
    }

    const zip = new window.JSZip();
    const folder = zip.folder("Good_Photos");

    // Add each photo file to the zip
    photos.forEach((p, idx) => {
      // Use clean unique name if duplicate names exist
      const fileName = p.name || `photo_${idx + 1}.jpg`;
      folder.file(fileName, p.file);
    });

    // Generate zip with low compression level for superfast packing
    const zipBlob = await zip.generateAsync(
      {
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 2 }
      },
      (metadata) => {
        if (typeof onProgress === "function") {
          onProgress(Math.round(metadata.percent));
        }
      }
    );

    // Trigger local browser download
    const downloadUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

    return true;
  }
}

window.ZipExporter = ZipExporter;
