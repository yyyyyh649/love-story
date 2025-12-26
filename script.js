// Love Story Diary Application
class DiaryApp {
    constructor() {
        this.entries = [];
        this.loadEntries();
        this.initializeEventListeners();
        this.displayEntries();
        
        // Set today's date as default
        document.getElementById('entryDate').valueAsDate = new Date();
    }

    // Load entries from localStorage
    loadEntries() {
        const stored = localStorage.getItem('loveDiaryEntries');
        if (stored) {
            this.entries = JSON.parse(stored);
        }
    }

    // Save entries to localStorage
    saveEntries() {
        localStorage.setItem('loveDiaryEntries', JSON.stringify(this.entries));
    }

    // Initialize all event listeners
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
    }

    // Preview uploaded images
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

    // Add new diary entry
    async addEntry() {
        const date = document.getElementById('entryDate').value;
        const title = document.getElementById('entryTitle').value;
        const location = document.getElementById('entryLocation').value;
        const event = document.getElementById('entryEvent').value;
        const content = document.getElementById('entryContent').value;
        const imageFiles = document.getElementById('entryImage').files;

        // Convert images to base64
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
            content,
            images,
            createdAt: new Date().toISOString()
        };

        this.entries.unshift(entry); // Add to beginning
        this.saveEntries();
        this.displayEntries();
        this.clearForm();
        
        // Show success message
        alert('日记已成功保存！💕');
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Clear the form
    clearForm() {
        document.getElementById('diaryForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('entryDate').valueAsDate = new Date();
    }

    // Display all entries
    displayEntries(filteredEntries = null) {
        const container = document.getElementById('entriesContainer');
        const entriesToDisplay = filteredEntries || this.entries;

        if (entriesToDisplay.length === 0) {
            container.innerHTML = '<p class="no-entries">还没有日记，开始记录你们的故事吧！💑</p>';
            return;
        }

        container.innerHTML = entriesToDisplay.map(entry => this.renderEntry(entry)).join('');

        // Add event listeners for each entry
        entriesToDisplay.forEach(entry => {
            // Delete button
            const deleteBtn = document.getElementById(`delete-${entry.id}`);
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteEntry(entry.id));
            }

            // Export single entry buttons
            const exportPDFBtn = document.getElementById(`export-pdf-${entry.id}`);
            if (exportPDFBtn) {
                exportPDFBtn.addEventListener('click', () => this.exportSinglePDF(entry.id));
            }

            const exportPNGBtn = document.getElementById(`export-png-${entry.id}`);
            if (exportPNGBtn) {
                exportPNGBtn.addEventListener('click', () => this.exportSinglePNG(entry.id));
            }

            // Image click for fullscreen
            entry.images.forEach((img, index) => {
                const imgElement = document.getElementById(`img-${entry.id}-${index}`);
                if (imgElement) {
                    imgElement.addEventListener('click', () => this.showFullscreenImage(img));
                }
            });
        });
    }

    // Render a single entry
    renderEntry(entry) {
        const dateObj = new Date(entry.date);
        const formattedDate = dateObj.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        const imagesHtml = entry.images.length > 0 ? `
            <div class="entry-images">
                ${entry.images.map((img, index) => `
                    <img src="${img}" alt="日记图片" id="img-${entry.id}-${index}">
                `).join('')}
            </div>
        ` : '';

        const locationHtml = entry.location ? `<span>📍 <strong>地点：</strong>${entry.location}</span>` : '';
        const eventHtml = entry.event ? `<span>🎯 <strong>事件：</strong>${entry.event}</span>` : '';

        return `
            <div class="diary-entry" id="entry-${entry.id}">
                <div class="entry-header">
                    <div class="entry-title">${entry.title}</div>
                    <div class="entry-date">📅 ${formattedDate}</div>
                </div>
                <div class="entry-meta">
                    ${locationHtml}
                    ${eventHtml}
                </div>
                <div class="entry-content">${entry.content}</div>
                ${imagesHtml}
                <div class="entry-actions">
                    <button class="btn btn-small btn-info" id="export-pdf-${entry.id}">📄 导出PDF</button>
                    <button class="btn btn-small btn-info" id="export-png-${entry.id}">🖼️ 导出PNG</button>
                    <button class="btn btn-small btn-danger" id="delete-${entry.id}">🗑️ 删除</button>
                </div>
            </div>
        `;
    }

    // Delete entry
    deleteEntry(id) {
        if (confirm('确定要删除这条日记吗？')) {
            this.entries = this.entries.filter(entry => entry.id !== id);
            this.saveEntries();
            this.displayEntries();
        }
    }

    // Filter entries
    filterEntries() {
        const dateFilter = document.getElementById('filterDate').value;
        const locationFilter = document.getElementById('filterLocation').value.toLowerCase();
        const eventFilter = document.getElementById('filterEvent').value.toLowerCase();

        let filtered = this.entries;

        if (dateFilter) {
            filtered = filtered.filter(entry => entry.date === dateFilter);
        }

        if (locationFilter) {
            filtered = filtered.filter(entry => 
                entry.location && entry.location.toLowerCase().includes(locationFilter)
            );
        }

        if (eventFilter) {
            filtered = filtered.filter(entry => 
                entry.event && entry.event.toLowerCase().includes(eventFilter)
            );
        }

        this.displayEntries(filtered);
    }

    // Clear all filters
    clearFilters() {
        document.getElementById('filterDate').value = '';
        document.getElementById('filterLocation').value = '';
        document.getElementById('filterEvent').value = '';
        this.displayEntries();
    }

    // Show fullscreen image
    showFullscreenImage(imageSrc) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('imageModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'imageModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <span class="modal-close">&times;</span>
                <img class="modal-content" id="modalImage">
            `;
            document.body.appendChild(modal);

            // Close modal on click
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.className === 'modal-close') {
                    modal.classList.remove('active');
                }
            });
        }

        document.getElementById('modalImage').src = imageSrc;
        modal.classList.add('active');
    }

    // Export all entries to PDF using browser print
    async exportAllPDF() {
        if (this.entries.length === 0) {
            alert('没有日记可以导出！');
            return;
        }

        // Hide unnecessary elements and trigger print dialog
        const addSection = document.querySelector('.add-entry-section');
        const filterSection = document.querySelector('.filter-section');
        const entriesHeader = document.querySelector('.entries-header');
        const actionButtons = document.querySelectorAll('.entry-actions');
        
        // Store original display values
        const originalDisplays = {
            add: addSection.style.display,
            filter: filterSection.style.display,
            header: entriesHeader.style.display
        };
        
        // Hide elements
        addSection.style.display = 'none';
        filterSection.style.display = 'none';
        entriesHeader.style.display = 'none';
        actionButtons.forEach(btn => btn.style.display = 'none');
        
        // Trigger print dialog
        window.print();
        
        // Restore elements after a short delay
        setTimeout(() => {
            addSection.style.display = originalDisplays.add;
            filterSection.style.display = originalDisplays.filter;
            entriesHeader.style.display = originalDisplays.header;
            actionButtons.forEach(btn => btn.style.display = '');
        }, 100);
    }

    // Export all entries to PNG using canvas
    async exportAllPNG() {
        if (this.entries.length === 0) {
            alert('没有日记可以导出！');
            return;
        }

        try {
            const entriesContainer = document.getElementById('entriesContainer');
            
            // Hide action buttons temporarily
            const actionButtons = document.querySelectorAll('.entry-actions');
            actionButtons.forEach(btn => btn.style.display = 'none');

            // Create a canvas using SVG foreignObject
            const canvas = await this.elementToCanvas(entriesContainer);
            
            const link = document.createElement('a');
            link.download = 'love-diary-all.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Show action buttons again
            actionButtons.forEach(btn => btn.style.display = '');
        } catch (error) {
            console.error('PNG export failed:', error);
            alert('PNG导出失败，请重试！');
        }
    }

    // Export single entry to PDF using browser print
    async exportSinglePDF(entryId) {
        const entryElement = document.getElementById(`entry-${entryId}`);
        const entry = this.entries.find(e => e.id === entryId);
        
        // Create a new window with just this entry
        const printWindow = window.open('', '', 'width=800,height=600');
        
        // Copy styles
        const styles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    return '';
                }
            })
            .join('\n');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Love Diary - ${entry.date}</title>
                <style>${styles}</style>
            </head>
            <body style="background: white; padding: 20px;">
                ${entryElement.outerHTML}
            </body>
            </html>
        `);
        
        // Hide action buttons in print window
        const printActionButtons = printWindow.document.querySelector('.entry-actions');
        if (printActionButtons) printActionButtons.style.display = 'none';
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    // Export single entry to PNG using canvas
    async exportSinglePNG(entryId) {
        const entryElement = document.getElementById(`entry-${entryId}`);
        const entry = this.entries.find(e => e.id === entryId);
        
        try {
            // Hide action buttons temporarily
            const actionButtons = entryElement.querySelector('.entry-actions');
            if (actionButtons) actionButtons.style.display = 'none';

            const canvas = await this.elementToCanvas(entryElement);

            const link = document.createElement('a');
            link.download = `love-diary-${entry.date}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Show action buttons again
            if (actionButtons) actionButtons.style.display = '';
        } catch (error) {
            console.error('PNG export failed:', error);
            alert('PNG导出失败，请重试！');
        }
    }

    // Convert DOM element to canvas without external libraries
    async elementToCanvas(element) {
        return new Promise((resolve, reject) => {
            try {
                const rect = element.getBoundingClientRect();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size (2x for better quality)
                canvas.width = rect.width * 2;
                canvas.height = rect.height * 2;
                
                // Scale context for higher quality
                ctx.scale(2, 2);
                
                // Fill background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, rect.width, rect.height);
                
                // Use SVG foreignObject to render HTML
                const data = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
                        <foreignObject width="100%" height="100%">
                            <div xmlns="http://www.w3.org/1999/xhtml" style="font-size: 14px;">
                                ${element.outerHTML}
                            </div>
                        </foreignObject>
                    </svg>
                `;
                
                const img = new Image();
                const blob = new Blob([data], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    resolve(canvas);
                };
                
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    // Fallback: create a simple canvas with text
                    ctx.fillStyle = '#333';
                    ctx.font = '16px Arial';
                    ctx.fillText('导出内容', 10, 30);
                    resolve(canvas);
                };
                
                img.src = url;
            } catch (error) {
                reject(error);
            }
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DiaryApp();
});
