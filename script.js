// Love Story Diary Application
class DiaryApp {
    constructor() {
        this.entries = [];
        this.loadEntries();
        this.initializeEventListeners();
        this.initializeRichEditor();
        this.displayEntries();
        
        // Set today's date as default
        document.getElementById('entryDate').valueAsDate = new Date();
    }

    loadEntries() {
        const stored = localStorage.getItem('loveDiaryEntries');
        if (stored) {
            this.entries = JSON.parse(stored);
        }
    }

    saveEntries() {
        localStorage.setItem('loveDiaryEntries', JSON.stringify(this.entries));
    }

    initializeEventListeners() {
        // Form submission
        document.getElementById('diaryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEntry();
        });

        // Image preview
        document.getElementById('entryImage').addEventListener('change', (e) => {
            this.previewImages(e.target.files);
        });

        // Filter controls
        document.getElementById('filterDate').addEventListener('change', () => this.filterEntries());
        document.getElementById('filterLocation').addEventListener('input', () => this.filterEntries());
        document.getElementById('filterEvent').addEventListener('input', () => this.filterEntries());
        document.getElementById('clearFilter').addEventListener('click', () => this.clearFilters());

        // Export buttons
        document.getElementById('exportAllPDF').addEventListener('click', () => this.exportAllPDF());
        document.getElementById('exportAllPNG').addEventListener('click', () => this.exportAllPNG());

        // Close modal
        document.querySelector('.modal-close').addEventListener('click', () => {
            document.getElementById('imageModal').classList.remove('active');
        });
        document.getElementById('imageModal').addEventListener('click', (e) => {
            if(e.target.id === 'imageModal') e.target.classList.remove('active');
        });
    }

    // Initialize simple rich text toolbar actions
    initializeRichEditor() {
        const buttons = document.querySelectorAll('.editor-toolbar button');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent form submission
                const cmd = btn.dataset.cmd;
                const val = btn.dataset.val || null;
                document.execCommand(cmd, false, val);
                // Keep focus on editor
                document.getElementById('entryContentEditor').focus();
            });
        });
    }

    previewImages(files) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }

    async addEntry() {
        const date = document.getElementById('entryDate').value;
        const title = document.getElementById('entryTitle').value;
        const location = document.getElementById('entryLocation').value;
        const event = document.getElementById('entryEvent').value;
        // Get HTML content from contenteditable div
        const content = document.getElementById('entryContentEditor').innerHTML;
        const imageFiles = document.getElementById('entryImage').files;

        if (!content.trim()) {
            alert('请写点什么吧~');
            return;
        }

        const images = [];
        for (let file of imageFiles) {
            const base64 = await this.fileToBase64(file);
            images.push(base64);
        }

        const entry = {
            id: Date.now(),
            date,
            title,
            location,
            event,
            content, // Now stores HTML
            images,
            createdAt: new Date().toISOString()
        };

        this.entries.unshift(entry);
        this.saveEntries();
        this.displayEntries();
        this.clearForm();
        
        // Show cute animation or alert
        const btn = document.querySelector('.btn-primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> 保存成功!';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    clearForm() {
        document.getElementById('diaryForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('entryContentEditor').innerHTML = ''; // Clear editor
        document.getElementById('entryDate').valueAsDate = new Date();
    }

    displayEntries(filteredEntries = null) {
        const container = document.getElementById('entriesContainer');
        const entriesToDisplay = filteredEntries || this.entries;

        if (entriesToDisplay.length === 0) {
            container.innerHTML = '<p class="no-entries">还没有日记，开始记录你们的故事吧！💑</p>';
            return;
        }

        container.innerHTML = entriesToDisplay.map(entry => this.renderEntry(entry)).join('');

        // Re-attach listeners for dynamic elements
        entriesToDisplay.forEach(entry => {
            const deleteBtn = document.getElementById(`delete-${entry.id}`);
            if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteEntry(entry.id));

            // Image click
            entry.images.forEach((img, index) => {
                const imgEl = document.getElementById(`img-${entry.id}-${index}`);
                if (imgEl) imgEl.addEventListener('click', () => this.showFullscreenImage(img));
            });
        });
    }

    renderEntry(entry) {
        const dateObj = new Date(entry.date);
        const dateStr = dateObj.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        const yearStr = dateObj.getFullYear();
        const weekStr = dateObj.toLocaleDateString('zh-CN', { weekday: 'short' });

        const imagesHtml = entry.images.length > 0 ? `
            <div class="entry-images">
                ${entry.images.map((img, index) => `
                    <img src="${img}" id="img-${entry.id}-${index}" loading="lazy">
                `).join('')}
            </div>
        ` : '';

        const locationTag = entry.location ? `<span><i class="fas fa-map-marker-alt"></i> ${entry.location}</span>` : '';
        const eventTag = entry.event ? `<span><i class="fas fa-bookmark"></i> ${entry.event}</span>` : '';

        return `
            <div class="diary-entry" id="entry-${entry.id}">
                <div class="entry-header">
                    <div class="entry-title">${entry.title}</div>
                    <div class="entry-date">${yearStr}.${dateStr} (${weekStr})</div>
                </div>
                ${(locationTag || eventTag) ? `<div class="entry-meta">${locationTag}${eventTag}</div>` : ''}
                
                <div class="entry-content">${entry.content}</div>
                
                ${imagesHtml}
                
                <div class="entry-actions">
                    <button class="btn btn-small btn-outline" style="border-color: #dc3545; color: #dc3545;" id="delete-${entry.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    deleteEntry(id) {
        if (confirm('确定要移除这条珍贵的回忆吗？')) {
            this.entries = this.entries.filter(entry => entry.id !== id);
            this.saveEntries();
            this.displayEntries();
        }
    }

    filterEntries() {
        const dateFilter = document.getElementById('filterDate').value;
        const locationFilter = document.getElementById('filterLocation').value.toLowerCase();
        const eventFilter = document.getElementById('filterEvent').value.toLowerCase();

        let filtered = this.entries;

        if (dateFilter) filtered = filtered.filter(entry => entry.date === dateFilter);
        if (locationFilter) filtered = filtered.filter(entry => entry.location && entry.location.toLowerCase().includes(locationFilter));
        if (eventFilter) filtered = filtered.filter(entry => entry.event && entry.event.toLowerCase().includes(eventFilter));

        this.displayEntries(filtered);
    }

    clearFilters() {
        document.getElementById('filterDate').value = '';
        document.getElementById('filterLocation').value = '';
        document.getElementById('filterEvent').value = '';
        this.displayEntries();
    }

    showFullscreenImage(src) {
        document.getElementById('modalImage').src = src;
        document.getElementById('imageModal').classList.add('active');
    }

    // Retained export functions (simplified for brevity)
    exportAllPDF() { window.print(); }
    
    async exportAllPNG() {
        alert("为保证最佳效果，建议使用浏览器截图功能保存长图~");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DiaryApp();
});
