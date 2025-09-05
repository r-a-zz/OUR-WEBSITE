export class DiaryExporter {
  static exportToJSON(notes) {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `diary-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  static exportToMarkdown(notes) {
    const markdown = notes.map(note => {
      const date = new Date(note.date).toLocaleDateString();
      return `# ${note.subject || 'Diary Entry'}\n\n**Date:** ${date}\n\n${note.content}\n\n---\n\n`;
    }).join('');

    const dataUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
    const exportFileDefaultName = `diary-export-${new Date().toISOString().split('T')[0]}.md`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  static async importFromJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          resolve(imported);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.readAsText(file);
    });
  }
}
