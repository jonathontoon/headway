const transformFileName = (data: File, action: string): string =>
  action === 'encrypt'
    ? `${data.name}.enc`
    : data.name.replace('.enc', '') || 'Untitled'

export default transformFileName
