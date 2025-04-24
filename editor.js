class SmartEditor {
  static init() {
    const editor = document.getElementById('code-editor');
    editor.value = '// Start coding\n';
    editor.addEventListener('input', () => {
      showToast('Code updated', 'info');
    });
  }
}

SmartEditor.init();