const downloadFile = (file: Blob, fileName: string): void => {
  const downloadElement: HTMLAnchorElement = document.createElement("a")
  downloadElement.href = URL.createObjectURL(file)
  downloadElement.download = fileName
  downloadElement.style.display = "none"
  document.body.appendChild(downloadElement)
  downloadElement.click()
  document.body.removeChild(downloadElement)
}

export default downloadFile
