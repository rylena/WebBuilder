document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const elements = document.querySelectorAll('.element');
    const exportBtn = document.getElementById('exportBtn');
    const previewBtn = document.getElementById('previewBtn');
    const exportModal = document.getElementById('exportModal');
    const closeModal = document.querySelector('.close');
    const copyCodeBtn = document.getElementById('copyCode');
    const propertiesContent = document.getElementById('propertiesContent');
    let selectedElement = null;

    const backgroundColorPicker = document.getElementById('backgroundColorPicker');
    if (backgroundColorPicker) {
        canvas.style.backgroundColor = '#ffffff';
        
        backgroundColorPicker.addEventListener('input', (e) => {
            // Update canvas background in builder
            canvas.style.backgroundColor = e.target.value;
            
            // Update background color in the generated website
            const page = pages[currentPageIdx];
            if (page.sections.length) {
                const section = page.sections[currentSectionIdx];
                section.backgroundColor = e.target.value;
            }
            
            // Add background color to generated HTML
            const styleTag = document.createElement('style');
            styleTag.textContent = `
                body {
                    background-color: ${e.target.value};
                }
            `;
            document.head.appendChild(styleTag);
        });
    }

    // Drag and Drop functionality
    elements.forEach(element => {
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', element.dataset.type);
        });
    });

    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dropZone = canvas.querySelector('.drop-zone');
        if (dropZone) {
            dropZone.style.borderColor = 'var(--accent-color)';
        }
    });

    canvas.addEventListener('dragleave', (e) => {
        e.preventDefault();
        const dropZone = canvas.querySelector('.drop-zone');
        if (dropZone) {
            dropZone.style.borderColor = 'var(--border-color)';
        }
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropZone = canvas.querySelector('.drop-zone');
        if (dropZone) {
            dropZone.style.borderColor = 'var(--border-color)';
        }

        const elementType = e.dataTransfer.getData('text/plain');
        if (elementType === 'move') {
            // Handle reordering
            const draggedElement = document.querySelector('.dragging');
            if (draggedElement) {
                const dropTarget = e.target.closest('.draggable') || canvas;
                if (dropTarget !== draggedElement) {
                    if (dropTarget === canvas) {
                        canvas.appendChild(draggedElement);
                    } else {
                        const rect = dropTarget.getBoundingClientRect();
                        const midpoint = rect.top + rect.height / 2;
                        if (e.clientY < midpoint) {
                            dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
                        } else {
                            dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);
                        }
                    }
                }
            }
        } else {
            // Handle new element creation
            const newElement = createElement(elementType);
            if (dropZone) {
                canvas.removeChild(dropZone);
            }
            canvas.appendChild(newElement);
            updatePropertiesPanel(newElement);
        }
    });

    // Properties panel update
    function updatePropertiesPanel(element) {
        const type = element.querySelector('h2, p, button, img, hr').tagName.toLowerCase();
        let propertiesHTML = '';
        
        // Get the first text element inside the draggable
        const textEl = element.querySelector('h1, h2, h3, h4, h5, h6, p, button, label, span');
        const textColor = textEl ? getComputedStyle(textEl).color : '#111';
        const colorProperties = `
            <div class="property">
                <label>Text Color:</label>
                <input type="color" value="${rgbToHex(textColor)}" 
                       onchange="updateElement(this.value, 'textColor')">
            </div>`;
        
        switch(type) {
            case 'h2':
                propertiesHTML = `
                    <div class="property">
                        <label>Text:</label>
                        <input type="text" value="${element.querySelector('h2').textContent}" 
                               onchange="updateElement(this.value, 'text')">
                    </div>
                    <div class="property">
                        <label>Size:</label>
                        <select onchange="updateElement(this.value, 'size')">
                            <option value="h1">H1</option>
                            <option value="h2" selected>H2</option>
                            <option value="h3">H3</option>
                        </select>
                    </div>
                    ${colorProperties}`;
                break;
            case 'p':
                propertiesHTML = `
                    <div class="property">
                        <label>Text:</label>
                        <textarea onchange="updateElement(this.value, 'text')">${element.querySelector('p').textContent}</textarea>
                    </div>
                    ${colorProperties}`;
                break;
            case 'button':
                propertiesHTML = `
                    <div class="property">
                        <label>Text:</label>
                        <input type="text" value="${element.querySelector('button').textContent}" 
                               onchange="updateElement(this.value, 'text')">
                    </div>
                    <div class="property">
                        <label>Style:</label>
                        <select onchange="updateElement(this.value, 'style')">
                            <option value="btn">Default</option>
                            <option value="btn primary">Primary</option>
                        </select>
                    </div>
                    ${colorProperties}`;
                break;
            case 'img':
                propertiesHTML = `
                    <div class="property">
                        <label>Image URL:</label>
                        <input type="text" value="${element.querySelector('img').src}" 
                               onchange="updateElement(this.value, 'src')">
                    </div>
                    <div class="property">
                        <label>Alt Text:</label>
                        <input type="text" value="${element.querySelector('img').alt}" 
                               onchange="updateElement(this.value, 'alt')">
                    </div>
                    <div class="property">
                        <label>Border Color:</label>
                        <input type="color" value="${getComputedStyle(element).borderColor}" 
                               onchange="updateElement(this.value, 'borderColor')">
                    </div>`;
                break;
            case 'hr':
                propertiesHTML = `
                    <div class="property">
                        <label>Color:</label>
                        <input type="color" value="${getComputedStyle(element).borderColor}" 
                               onchange="updateElement(this.value, 'borderColor')">
                    </div>`;
                break;
            case 'rectangle':
            case 'circle':
            case 'rounded-rectangle':
            case 'triangle':
            case 'curve':
                propertiesHTML = `
                    <div class="property">
                        <label>Shape Color:</label>
                        <input type="color" value="#646cff" 
                               onchange="updateElement(this.value, 'shapeColor')">
                    </div>
                    <div class="property">
                        <label>Border Color:</label>
                        <input type="color" value="${getComputedStyle(element).borderColor || '#000000'}" 
                               onchange="updateElement(this.value, 'borderColor')">
                    </div>`;
                break;
        }
        
        propertiesContent.innerHTML = propertiesHTML;
    }

    // Update element properties
    window.updateElement = function(value, property) {
        if (!selectedElement) return;

        // Get the current page and section
        const page = pages[currentPageIdx];
        const section = page.sections[currentSectionIdx];
        const elData = section.elements.find(data => data.id === selectedElement.dataset.id);
        if (!elData) return;

        switch(property) {
            case 'text': {
                const textEl = selectedElement.querySelector('h2, p, button');
                if (textEl) {
                    textEl.textContent = value;
                    elData.text = value;
                }
                break;
            }
            case 'size': {
                const oldEl = selectedElement.querySelector('h2, p');
                if (oldEl) {
                    const newEl = document.createElement(value);
                    newEl.textContent = oldEl.textContent;
                    oldEl.parentNode.replaceChild(newEl, oldEl);
                    updatePropertiesPanel(selectedElement);
                }
                break;
            }
            case 'style': {
                const btnEl = selectedElement.querySelector('button');
                if (btnEl) {
                    btnEl.className = value;
                    elData.style = value;
                }
                break;
            }
            case 'src': {
                const imgEl = selectedElement.querySelector('img');
                if (imgEl) {
                    imgEl.src = value;
                    elData.src = value;
                }
                updatePropertiesPanel(selectedElement);
                break;
            }
            case 'alt': {
                const imgEl = selectedElement.querySelector('img');
                if (imgEl) {
                    imgEl.alt = value;
                    elData.alt = value;
                }
                break;
            }
            case 'textColor': {
                const textEls = selectedElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, button, label, span');
                textEls.forEach(el => {
                    el.style.color = value;
                });
                
                // Update the data model
                const page = pages[currentPageIdx];
                const section = page.sections[currentSectionIdx];
                const elData = section.elements.find(data => data.id === selectedElement.dataset.id);
                if (elData) {
                    elData.color = value;
                }
                break;
            }
            case 'backgroundColor': {
                selectedElement.style.backgroundColor = value;
                elData.backgroundColor = value;
                break;
            }
            case 'shapeColor': {
                const shapeDiv = selectedElement.querySelector('div[style*="background"]');
                const svgPolygon = selectedElement.querySelector('svg polygon');
                const svgPath = selectedElement.querySelector('svg path');

                if (shapeDiv) {
                    shapeDiv.style.backgroundColor = value;
                } else if (svgPolygon) {
                    svgPolygon.style.fill = value;
                } else if (svgPath) {
                    svgPath.style.stroke = value;
                }
                elData.shapeColor = value;
                break;
            }
            case 'borderColor': {
                selectedElement.style.borderColor = value;
                elData.borderColor = value;
                const hrEl = selectedElement.querySelector('hr');
                if (hrEl) hrEl.style.borderColor = value;
                const imgEl = selectedElement.querySelector('img');
                if (imgEl) imgEl.style.borderColor = value;
                break;
            }
        }
        saveToHistory();
    };

    // Export HTML
    exportBtn.addEventListener('click', () => {
        const html = generateHTML();
        document.getElementById('generatedCode').textContent = html;
        exportModal.style.display = 'block';
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });

    // Copy code
    copyCodeBtn.addEventListener('click', () => {
        const code = document.getElementById('generatedCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            copyCodeBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyCodeBtn.textContent = 'Copy Code';
            }, 2000);
        });
    });

    function generateHTML() {
        const page = pages[currentPageIdx];
        let bgColor = "#ffffff";
        let section = null;
        if (page.sections.length) {
            section = page.sections[currentSectionIdx];
            if (section.backgroundColor) bgColor = section.backgroundColor;
        }
        
        let html = `<!DOCTYPE html>
    <html>
    <head>
        <title>Generated Website</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                background-color: ${bgColor}; 
                margin: 0;
                padding: 0;
            }
    `;
    
        // Add custom styles for each element
        const elements = canvas.querySelectorAll('.draggable');
        elements.forEach((element, index) => {
            const innerElement = element.querySelector('h2, p, button, img, hr');
            if (innerElement) {
                html += `        .element-${index} {`;
                if (innerElement.style.color) html += `\n            color: ${innerElement.style.color};`;
                if (innerElement.style.backgroundColor) html += `\n            background-color: ${innerElement.style.backgroundColor};`;
                if (innerElement.style.borderColor) html += `\n            border-color: ${innerElement.style.borderColor};`;
                // Use stored fontSize if available
                const elData = section.elements.find(data => data.id === element.dataset.id);
                if (elData && elData.fontSize) html += `\n            font-size: ${elData.fontSize};`;
                html += '\n        }\n';
            }
        });
    
        html += '    </style>\n</head>\n<body>\n';
    
        elements.forEach((element, index) => {
            const innerElement = element.querySelector('h2, p, button, img, hr, div');
            if (innerElement) {
                const tagName = innerElement.tagName.toLowerCase();
                // Get computed position relative to canvas
                const rect = element.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                const left = rect.left - canvasRect.left;
                const top = rect.top - canvasRect.top;
                
                // Use actual element dimensions
                const width = element.offsetWidth + 'px';
                const height = element.offsetHeight + 'px';
                
                // Inline style for absolute positioning
                let style = `position:absolute;left:${left}px;top:${top}px;width:${width};height:${height};`;

                // Add this to the element style generation (from user request)
                if (element.style.backgroundColor) {
                    style += `background-color: ${element.style.backgroundColor};`;
                }
                const shape = element.querySelector('div, svg');
                if (shape) {
                    const colorValueForShape = shape.style.backgroundColor || shape.style.fill;
                    if (colorValueForShape) {
                        style += `background-color: ${colorValueForShape};`;
                    }
                }

                html += `    <${tagName} class="element-${index}" style="${style}">${innerElement.innerHTML}</${tagName}>\n`;
            }
        });
    
        html += '</body>\n</html>';
        return html;
    }

    // Preview functionality
    previewBtn.addEventListener('click', () => {
        const html = generateHTML();
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(html);
        previewWindow.document.close();
    });

    // --- Template and Project System ---
    const newProjectBtn = document.getElementById('newProjectBtn');
    const openTemplateBtn = document.getElementById('openTemplateBtn');
    const templateModal = document.getElementById('templateModal');
    const closeTemplateModal = document.getElementById('closeTemplateModal');
    const templateBtns = document.querySelectorAll('.template-btn');

    const templates = [
        [
            {type: 'heading', text: 'Welcome to Lorem Ipsum', left: 200, top: 80, width: 400, height: 60, color: '#fff'},
            {type: 'paragraph', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod.', left: 200, top: 160, width: 400, height: 60, color: '#ccc'},
            {type: 'button', text: 'Get Started', left: 200, top: 240, width: 180, height: 50},
            {type: 'image', src: 'https://via.placeholder.com/300x200', left: 650, top: 120, width: 300, height: 200}
        ],
        [
            {type: 'heading', text: 'Blog Title', left: 100, top: 60, width: 300, height: 50, color: '#fff'},
            {type: 'paragraph', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', left: 100, top: 130, width: 500, height: 50, color: '#ccc'},
            {type: 'divider', left: 100, top: 200, width: 500, height: 2},
            {type: 'heading', text: 'Post 1', left: 100, top: 220, width: 200, height: 40, color: '#fff'},
            {type: 'paragraph', text: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', left: 100, top: 270, width: 500, height: 50, color: '#ccc'}
        ],
        [
            {type: 'heading', text: 'Jane Doe', left: 350, top: 60, width: 300, height: 50, color: '#fff'},
            {type: 'paragraph', text: 'Web Designer & Developer', left: 350, top: 120, width: 300, height: 40, color: '#ccc'},
            {type: 'image', src: 'https://via.placeholder.com/200x200', left: 100, top: 100, width: 200, height: 200},
            {type: 'button', text: 'Contact Me', left: 350, top: 180, width: 180, height: 50}
        ],
        [
            {type: 'heading', text: 'ACME Corp.', left: 250, top: 100, width: 300, height: 50, color: '#fff'},
            {type: 'paragraph', text: 'Innovating the future. Lorem ipsum dolor sit amet.', left: 250, top: 160, width: 300, height: 40, color: '#ccc'},
            {type: 'button', text: 'Learn More', left: 250, top: 220, width: 180, height: 50},
            {type: 'divider', left: 250, top: 290, width: 300, height: 2}
        ],
        [
            {type: 'heading', text: 'About Us', left: 200, top: 80, width: 400, height: 60, color: '#fff'},
            {type: 'paragraph', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae.', left: 200, top: 160, width: 400, height: 60, color: '#ccc'},
            {type: 'image', src: 'https://via.placeholder.com/300x150', left: 650, top: 120, width: 300, height: 150}
        ]
    ];

    function clearCanvas() {
        while (canvas.firstChild) canvas.removeChild(canvas.firstChild);
        const newDropZone = document.createElement('div');
        newDropZone.className = 'drop-zone';
        newDropZone.innerHTML = '<p>Drag and drop elements here</p>';
        canvas.appendChild(newDropZone);
        propertiesContent.innerHTML = '<p class="no-selection">Select an element to edit its properties</p>';
    }

    function loadTemplate(templateIdx) {
        clearCanvas();
        const template = templates[templateIdx];
        template.forEach(data => {
            const el = createElement(data.type);
            // Set content
            if (data.type === 'heading') el.querySelector('h2').textContent = data.text;
            if (data.type === 'paragraph') el.querySelector('p').textContent = data.text;
            if (data.type === 'button') el.querySelector('button').textContent = data.text;
            if (data.type === 'image' && data.src) el.querySelector('img').src = data.src;
            // Set position and size
            el.style.left = data.left + 'px';
            el.style.top = data.top + 'px';
            el.style.width = data.width + 'px';
            el.style.height = data.height + 'px';
            // Set color
            if (data.color) el.querySelector('h2, p').style.color = data.color;
            canvas.appendChild(el);
        });
    }

    newProjectBtn.addEventListener('click', () => {
        clearCanvas();
    });

    openTemplateBtn.addEventListener('click', () => {
        templateModal.style.display = 'block';
    });

    closeTemplateModal.addEventListener('click', () => {
        templateModal.style.display = 'none';
    });

    templateBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.template);
            loadTemplate(idx);
            templateModal.style.display = 'none';
        });
    });

    // --- Section and Page Management ---
    let pages = [
        { name: 'Home', sections: [] }
    ];
    let currentPageIdx = 0;
    let currentSectionIdx = 0;

    const sectionsList = document.querySelector('.sections-list');
    const pagesList = document.querySelector('.pages-list');
    const addSectionBtn = document.querySelector('.add-section-btn');
    const addPageBtn = document.querySelector('.add-page-btn');
    const toggleGridBtn = document.querySelector('.toggle-grid');

    // --- Grid and Snap Settings ---
    const gridSize = 32; // Define grid size
    const snap = (val) => Math.round(val / gridSize) * gridSize;

    function renderSections() {
        sectionsList.innerHTML = '';
        const page = pages[currentPageIdx];
        page.sections.forEach((section, idx) => {
            const btn = document.createElement('button');
            btn.className = 'section-tab' + (idx === currentSectionIdx ? ' active' : '');
            btn.textContent = section.name || `Section ${idx + 1}`;
            btn.onclick = () => {
                currentSectionIdx = idx;
                renderSections();
                renderCanvas();
            };
            // Remove section button
            const removeBtn = document.createElement('span');
            removeBtn.textContent = '×';
            removeBtn.className = 'remove-section';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                page.sections.splice(idx, 1);
                if (currentSectionIdx >= page.sections.length) currentSectionIdx = page.sections.length - 1;
                renderSections();
                renderCanvas();
            };
            btn.appendChild(removeBtn);
            sectionsList.appendChild(btn);
        });
    }

    function renderPages() {
        pagesList.innerHTML = '';
        pages.forEach((page, idx) => {
            const btn = document.createElement('button');
            btn.className = 'page-tab' + (idx === currentPageIdx ? ' active' : '');
            btn.textContent = page.name;
            btn.onclick = () => {
                currentPageIdx = idx;
                currentSectionIdx = 0;
                renderPages();
                renderSections();
                renderCanvas();
            };
            // Remove page button
            if (pages.length > 1) {
                const removeBtn = document.createElement('span');
                removeBtn.textContent = '×';
                removeBtn.className = 'remove-page';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    pages.splice(idx, 1);
                    if (currentPageIdx >= pages.length) currentPageIdx = pages.length - 1;
                    renderPages();
                    renderSections();
                    renderCanvas();
                };
                btn.appendChild(removeBtn);
            }
            pagesList.appendChild(btn);
        });
    }

    addSectionBtn.addEventListener('click', () => {
        const page = pages[currentPageIdx];
        page.sections.push({ name: `Section ${page.sections.length + 1}`, elements: [] });
        currentSectionIdx = page.sections.length - 1;
        renderSections();
        renderCanvas();
    });

    addPageBtn.addEventListener('click', () => {
        pages.push({ name: `Page ${pages.length + 1}`, sections: [] });
        currentPageIdx = pages.length - 1;
        currentSectionIdx = 0;
        renderPages();
        renderSections();
        renderCanvas();
    });

    toggleGridBtn.addEventListener('click', () => {
        canvas.classList.toggle('grid-enabled');
    });

    function renderCanvas() {
        // Clear canvas
        while (canvas.firstChild) canvas.removeChild(canvas.firstChild);
        const page = pages[currentPageIdx];
        if (!page.sections.length) {
            const newDropZone = document.createElement('div');
            newDropZone.className = 'drop-zone';
            newDropZone.innerHTML = '<p>Add a section to start building</p>';
            canvas.appendChild(newDropZone);
            return;
        }
        // Render current section
        const section = page.sections[currentSectionIdx];
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section-container';
        sectionDiv.style.position = 'relative';
        sectionDiv.style.minHeight = '400px';
        sectionDiv.style.width = '100%';
        sectionDiv.style.background = 'transparent';
        section.elements.forEach(elData => {
            const el = createElement(elData.type);
            // Set content
            if (elData.type === 'heading') el.querySelector('h2').textContent = elData.text;
            if (elData.type === 'paragraph') el.querySelector('p').textContent = elData.text;
            if (elData.type === 'button') el.querySelector('button').textContent = elData.text;
            if (elData.type === 'image' && elData.src) el.querySelector('img').src = elData.src;
            // Set position and size from stored data
            el.style.left = elData.left + 'px';
            el.style.top = elData.top + 'px';
            el.style.width = elData.width + 'px';
            el.style.height = elData.height + 'px';
            // Set color from stored data
            if (elData.color) {
                const textEls = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, button, label, span');
                textEls.forEach(elm => elm.style.color = elData.color);
            }
            if (elData.backgroundColor) el.style.backgroundColor = elData.backgroundColor;
            if (elData.borderColor) el.style.borderColor = elData.borderColor;
            el.dataset.id = elData.id;
            sectionDiv.appendChild(el);
        });
        canvas.appendChild(sectionDiv);
    }

    // When adding new elements, add to current section and snap initial position/size
    function createElementAndStore(type, initialPos = { x: 100, y: 100 }) {
        const el = createElement(type);
        // Store in section
        const page = pages[currentPageIdx];
        if (!page.sections.length) return el;
        const section = page.sections[currentSectionIdx];

        // Get canvas padding dynamically
        const canvasComputedStyle = window.getComputedStyle(canvas);
        const canvasPaddingLeft = parseInt(canvasComputedStyle.paddingLeft, 10) || 0;
        const canvasPaddingTop = parseInt(canvasComputedStyle.paddingTop, 10) || 0;

        // Default element data, snapped to grid
        const elData = {
            type,
            text: type === 'heading' ? 'New Heading' : type === 'paragraph' ? 'New paragraph text' : type === 'button' ? 'New Button' : '',
            src: type === 'image' ? 'https://via.placeholder.com/300x200' : '',
            left: snap(initialPos.x - canvasPaddingLeft), // Adjusted for padding
            top: snap(initialPos.y - canvasPaddingTop),   // Adjusted for padding
            width: snap(200),
            height: snap(60),
            color: undefined,
            backgroundColor: undefined,
            borderColor: undefined,
            id: Math.random().toString(36).substr(2, 9) // Assign a unique ID
        };
        section.elements.push(elData);

        // Set initial styles on the created element from data
        el.style.position = 'absolute';
        el.style.left = elData.left + 'px';
        el.style.top = elData.top + 'px';
        el.style.width = elData.width + 'px';
        el.style.height = elData.height + 'px';
        el.dataset.id = elData.id; // Set data-id attribute

        
        renderCanvas(); // Re-render to show updated state
        return el;
    }

    // Base element creation function
    function createBaseElement(type) {
        const element = document.createElement('div');
        element.className = 'draggable';
        element.draggable = true;
        let content = '';
        switch(type) {
            case 'heading':
                content = '<h2>New Heading</h2>';
                break;
            case 'paragraph':
                content = '<p>New paragraph text</p>';
                break;
            case 'rectangle':
                content = '<div style="width:100%;height:100%;background:#646cff;border-radius:0;"></div>';
                break;
            case 'circle':
                content = '<div style="width:100%;height:100%;background:#646cff;border-radius:50%;"></div>';
                break;
            case 'rounded-rectangle':
                content = '<div style="width:100%;height:100%;background:#646cff;border-radius:24px;"></div>';
                break;
            case 'triangle':
                content = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,0 100,100 0,100" fill="#646cff" /></svg>`;
                break;
            case 'curve':
                content = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,100 Q50,0 100,100" stroke="#646cff" stroke-width="8" fill="none"/></svg>`;
                break;
            case 'image':
                content = '<img src="https://via.placeholder.com/300x200" alt="Placeholder image">';
                break;
        }
        element.innerHTML = content;
        return element;
    }

    // Main createElement function with all features
    function createElement(type) {
        const element = createBaseElement(type);
        
        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => {
            element.remove();
            if (canvas.children.length === 0) {
                const newDropZone = document.createElement('div');
                newDropZone.className = 'drop-zone';
                newDropZone.innerHTML = '<p>Drag and drop elements here</p>';
                canvas.appendChild(newDropZone);
            }
            propertiesContent.innerHTML = '<p class="no-selection">Select an element to edit its properties</p>';
            saveToHistory();
        };
        
        element.appendChild(removeBtn);
        
        // Add 8 resize handles (corners and sides)
        const handlePositions = ['nw','n','ne','e','se','s','sw','w'];
        handlePositions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            element.appendChild(handle);
        });
        
        // Make element draggable within canvas
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', 'move');
            element.classList.add('dragging');
        });
        
        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });
        
        // Element selection
        element.addEventListener('click', (e) => {
            if (e.target !== removeBtn && e.target !== removeBtn.querySelector('i')) {
                document.querySelectorAll('.draggable').forEach(el => el.classList.remove('selected'));
                element.classList.add('selected');
                selectedElement = element;
                updatePropertiesPanel(element);
            }
        });
        
        // Position and drag handling
        element.style.position = 'absolute';
        element.style.left = '100px';
        element.style.top = '100px';
        
        element.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('resize-handle')) return;
            if (!element.classList.contains('draggable')) return;

            e.preventDefault();

            // Get initial mouse position and element position
            const startX = e.clientX;
            const startY = e.clientY;
            const elementLeft = parseInt(element.style.left) || 0;
            const elementTop = parseInt(element.style.top) || 0;

            function moveAt(e) {
                // Calculate new position based on mouse movement
                const newLeft = elementLeft + (e.clientX - startX);
                const newTop = elementTop + (e.clientY - startY);

                // Apply snapped position
                element.style.left = snap(newLeft) + 'px';
                element.style.top = snap(newTop) + 'px';
            }

            function onMouseMove(e) {
                moveAt(e);
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                // Update elData with new position
                const page = pages[currentPageIdx];
                const section = page.sections[currentSectionIdx];
                const elData = section.elements.find(data => data.id === element.dataset.id);
                if (elData) {
                    elData.left = parseInt(element.style.left, 10) || 0;
                    elData.top = parseInt(element.style.top, 10) || 0;
                    // Ensure width and height are also up-to-date in elData if they could have changed
                    // For now, only position is updated here, assuming resize has its own update logic.
                }

                saveToHistory();
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Resize handling
        handlePositions.forEach(pos => {
            const handle = element.querySelector(`.resize-handle.${pos}`);
            if (handle) {
                handle.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    e.preventDefault();

                    let startX = e.clientX;
                    let startY = e.clientY;
                    let startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
                    let startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);

                    function doDrag(e) {
                        let newWidth = startWidth + e.clientX - startX;
                        let newHeight = startHeight + e.clientY - startY;

                        // Ensure minimum size
                        newWidth = Math.max(newWidth, gridSize);
                        newHeight = Math.max(newHeight, gridSize);

                        // Snap to grid
                        newWidth = snap(newWidth);
                        newHeight = snap(newHeight);

                        // Update element size
                        element.style.width = newWidth + 'px';
                        element.style.height = newHeight + 'px';

                        // Update inner content size
                        const innerElement = element.querySelector('h2, p, button');
                        if (innerElement) {
                            // Set font-size proportional to height (e.g., 50% of height)
                            const fontSize = Math.max(12, Math.floor(newHeight * 0.5)); // Minimum 12px
                            innerElement.style.fontSize = fontSize + 'px';
                            innerElement.style.width = '100%';
                            innerElement.style.height = '100%';
                            // Store font size in data for export
                            const page = pages[currentPageIdx];
                            const section = page.sections[currentSectionIdx];
                            const elData = section.elements.find(data => data.id === element.dataset.id);
                            if (elData) {
                                elData.fontSize = fontSize + 'px';
                            }
                        }

                        // Update stored data
                        const page = pages[currentPageIdx];
                        const section = page.sections[currentSectionIdx];
                        const elData = section.elements.find(data => data.id === element.dataset.id);
                        if (elData) {
                            elData.width = newWidth;
                            elData.height = newHeight;
                        }
                    }

                    function stopDrag() {
                        document.removeEventListener('mousemove', doDrag);
                        document.removeEventListener('mouseup', stopDrag);
                        saveToHistory();
                    }

                    document.addEventListener('mousemove', doDrag);
                    document.addEventListener('mouseup', stopDrag);
                });
            }
        });

        element.ondragstart = () => false;
        
        // Save to history after creating the element
        saveToHistory();
        
        return element;
    }

    // Modify renderCanvas to use the updated createElement and stored data
    const originalRenderCanvas = renderCanvas;
    renderCanvas = function() {
        // Clear canvas
        while (canvas.firstChild) canvas.removeChild(canvas.firstChild);
        const page = pages[currentPageIdx];
        if (!page.sections.length) {
            const newDropZone = document.createElement('div');
            newDropZone.className = 'drop-zone';
            newDropZone.innerHTML = '<p>Add a section to start building</p>';
            canvas.appendChild(newDropZone);
            return;
        }
        // Render current section
        const section = page.sections[currentSectionIdx];
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section-container';
        sectionDiv.style.position = 'relative';
        sectionDiv.style.minHeight = '400px'; // Placeholder, needs dynamic height
        sectionDiv.style.width = '100%';
        sectionDiv.style.background = 'transparent'; // Placeholder
        section.elements.forEach(elData => {
            const el = createElement(elData.type);
            // Set content
            if (elData.type === 'heading') el.querySelector('h2').textContent = elData.text;
            if (elData.type === 'paragraph') el.querySelector('p').textContent = elData.text;
            if (elData.type === 'button') el.querySelector('button').textContent = elData.text;
            if (elData.type === 'image' && elData.src) el.querySelector('img').src = elData.src;
            // Set position and size from stored data
            el.style.left = elData.left + 'px';
            el.style.top = elData.top + 'px';
            el.style.width = elData.width + 'px';
            el.style.height = elData.height + 'px';
            // Set color from stored data
            if (elData.color) {
                const textEls = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, button, label, span');
                textEls.forEach(elm => elm.style.color = elData.color);
            }
            if (elData.backgroundColor) el.style.backgroundColor = elData.backgroundColor; // Apply background color to the element container
            if (elData.borderColor) el.style.borderColor = elData.borderColor; // Apply border color
            el.dataset.id = elData.id; // Set data-id for lookup

            // Re-add event listeners after recreating element in renderCanvas
             el.addEventListener('click', (e) => {
                if (e.target !== el.querySelector('.remove-btn') && e.target !== el.querySelector('.remove-btn i')) {
                    document.querySelectorAll('.draggable').forEach(fel => fel.classList.remove('selected'));
                    el.classList.add('selected');
                    selectedElement = el;
                    updatePropertiesPanel(el);
                }
             });
             // Re-add dblclick for inline editing
             el.addEventListener('dblclick', function(e) {
                 const target = el.querySelector('h2, p, button');
                 if (target && (target.tagName === 'H2' || target.tagName === 'P')) {
                     target.contentEditable = true;
                     target.focus();
                     target.onblur = () => {
                         target.contentEditable = false;
                          // Update text in data on blur
                          const page = pages[currentPageIdx];
                          const section = page.sections[currentSectionIdx];
                          const elData = section.elements.find(data => data.id === el.dataset.id);
                          if (elData) {
                              elData.text = target.textContent;
                          }
                     };
                 }
             });
             // Re-add remove button click logic
             const removeBtn = el.querySelector('.remove-btn');
             if (removeBtn) {
                removeBtn.onclick = () => {
                    el.remove();
                    // Remove from data
                    const page = pages[currentPageIdx];
                    const section = page.sections[currentSectionIdx];
                    section.elements = section.elements.filter(data => data.id !== el.dataset.id);
                    if (canvas.children.length === 0) {
                        const newDropZone = document.createElement('div');
                        newDropZone.className = 'drop-zone';
                        newDropZone.innerHTML = '<p>Drag and drop elements here</p>';
                        canvas.appendChild(newDropZone);
                    }
                    propertiesContent.innerHTML = '<p class="no-selection">Select an element to edit its properties</p>';
                };
             }

            sectionDiv.appendChild(el);
        });
        canvas.appendChild(sectionDiv);
    };

    // Initial render
    renderPages();
    // Need to add a default section if none exist on load
     if (!pages[currentPageIdx].sections.length) {
         pages[currentPageIdx].sections.push({ name: 'Section 1', elements: [] });
     }
    renderSections();
    renderCanvas();

    // History management for undo/redo
    let history = [];
    let currentHistoryIndex = -1;
    const maxHistoryLength = 50;

    function saveToHistory() {
        // Remove any future states if we're not at the end
        history = history.slice(0, currentHistoryIndex + 1);
        
        // Save current state
        const state = {
            pages: JSON.parse(JSON.stringify(pages)),
            currentPageIdx,
            currentSectionIdx
        };
        
        history.push(state);
        currentHistoryIndex++;
        
        // Limit history length
        if (history.length > maxHistoryLength) {
            history.shift();
            currentHistoryIndex--;
        }
        
        // Update undo/redo buttons
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        undoBtn.disabled = currentHistoryIndex <= 0;
        redoBtn.disabled = currentHistoryIndex >= history.length - 1;
    }

    function undo() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            const state = history[currentHistoryIndex];
            pages = JSON.parse(JSON.stringify(state.pages));
            currentPageIdx = state.currentPageIdx;
            currentSectionIdx = state.currentSectionIdx;
            renderPages();
            renderSections();
            renderCanvas();
            updateUndoRedoButtons();
        }
    }

    function redo() {
        if (currentHistoryIndex < history.length - 1) {
            currentHistoryIndex++;
            const state = history[currentHistoryIndex];
            pages = JSON.parse(JSON.stringify(state.pages));
            currentPageIdx = state.currentPageIdx;
            currentSectionIdx = state.currentSectionIdx;
            renderPages();
            renderSections();
            renderCanvas();
            updateUndoRedoButtons();
        }
    }

    // Initialize undo/redo buttons
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

  

    canvasHeight.addEventListener('input', (e) => {
        const height = e.target.value;
        canvas.style.height = height + 'px';
        canvasHeightDisplay.textContent = height + 'px';
        // Update the stored height in the current section
        const page = pages[currentPageIdx];
        if (page.sections.length) {
            const section = page.sections[currentSectionIdx];
            section.height = height;
        }
    });

    // Element duplication
    const duplicateElementBtn = document.getElementById('duplicateElementBtn');
    duplicateElementBtn.addEventListener('click', () => {
        if (!selectedElement) return;
        
        const page = pages[currentPageIdx];
        const section = page.sections[currentSectionIdx];
        const elData = section.elements.find(data => data.id === selectedElement.dataset.id);
        
        if (elData) {
            const newElData = JSON.parse(JSON.stringify(elData));
            newElData.id = Math.random().toString(36).substr(2, 9);
            newElData.left += 20;
            newElData.top += 20;
            section.elements.push(newElData);
            saveToHistory();
            renderCanvas();
        }
    });

    // Save element to library
    const saveElementBtn = document.getElementById('saveElementBtn');
    const savedElementsList = document.querySelector('.saved-elements-list');
    let savedElements = JSON.parse(localStorage.getItem('savedElements') || '[]');

    function renderSavedElements() {
        savedElementsList.innerHTML = '';
        savedElements.forEach((el, index) => {
            const div = document.createElement('div');
            div.className = 'element saved-element';
            div.draggable = true;
            div.innerHTML = `
                <i class="fas fa-${getElementIcon(el.type)}"></i>
                <span>${el.name || el.type}</span>
                <button class="remove-saved" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            div.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(el));
            });
            savedElementsList.appendChild(div);
        });
    }

    function getElementIcon(type) {
        const icons = {
            heading: 'heading',
            paragraph: 'paragraph',
            rectangle: 'square-full',
            circle: 'circle',
            'rounded-rectangle': 'square',
            triangle: 'play',
            curve: 'wave-square',
            image: 'image',
        };
        return icons[type] || 'code';
    }

    saveElementBtn.addEventListener('click', () => {
        if (!selectedElement) return;
        
        const page = pages[currentPageIdx];
        const section = page.sections[currentSectionIdx];
        const elData = section.elements.find(data => data.id === selectedElement.dataset.id);
        
        if (elData) {
            const name = prompt('Enter a name for this element:', elData.type);
            if (name) {
                const savedEl = {
                    ...JSON.parse(JSON.stringify(elData)),
                    name
                };
                savedElements.push(savedEl);
                localStorage.setItem('savedElements', JSON.stringify(savedElements));
                renderSavedElements();
            }
        }
    });

    // Handle saved element removal
    savedElementsList.addEventListener('click', (e) => {
        if (e.target.closest('.remove-saved')) {
            const index = e.target.closest('.remove-saved').dataset.index;
            savedElements.splice(index, 1);
            localStorage.setItem('savedElements', JSON.stringify(savedElements));
            renderSavedElements();
        }
    });

    // Initialize saved elements
    renderSavedElements();

    // Attach close event to all .close buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // Helper to add drop listeners to container-content
    function enableContainerDrop(containerContent) {
        containerContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            containerContent.style.background = 'rgba(100,108,255,0.08)';
        });
        containerContent.addEventListener('dragleave', (e) => {
            e.preventDefault();
            containerContent.style.background = '';
        });
        containerContent.addEventListener('drop', (e) => {
            e.preventDefault();
            containerContent.style.background = '';
            const elementType = e.dataTransfer.getData('text/plain');
            if (elementType) {
                // Create the new element
                const newElement = createElement(elementType);
                // Position relative to container
                const rect = containerContent.getBoundingClientRect();
                const dropX = e.clientX - rect.left;
                const dropY = e.clientY - rect.top;
                newElement.style.left = snap(dropX) + 'px';
                newElement.style.top = snap(dropY) + 'px';
                containerContent.appendChild(newElement);
                updatePropertiesPanel(newElement);
                saveToHistory();
            }
        });
    }

    // Patch createElement to enable drop on container-content
    const originalCreateElement = createElement;
    createElement = function(type) {
        const element = originalCreateElement(type);
        // If this is a container, enable drop on its content area
        if (type === 'container') {
            const containerContent = element.querySelector('.container-content');
            if (containerContent) {
                enableContainerDrop(containerContent);
            }
        }
        return element;
    };

    // When rendering containers, re-enable drop on their content area
    // (Patch renderCanvas if needed, or ensure createElement is always used)
    // ... existing code ...
}); 

function rgbToHex(rgb) {
    if (!rgb) return '#111111';
    const result = rgb.match(/\d+/g);
    if (!result) return '#111111';
    return (
        '#' +
        result
            .slice(0, 3)
            .map(x => ('0' + parseInt(x).toString(16)).slice(-2))
            .join('')
    );
} 



