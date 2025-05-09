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

    // Background color picker logic
    const backgroundColorPicker = document.getElementById('backgroundColorPicker');
    if (backgroundColorPicker) {
        backgroundColorPicker.addEventListener('input', (e) => {
            document.body.style.backgroundColor = e.target.value;
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

    // Element creation
    function createElement(type) {
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
            case 'button':
                content = '<button class="btn">New Button</button>';
                break;
            case 'image':
                content = '<img src="https://via.placeholder.com/300x200" alt="Placeholder image">';
                break;
            case 'divider':
                content = '<hr>';
                break;
        }
        
        element.innerHTML = content;
        
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
        };
        
        element.appendChild(removeBtn);
        
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
        
        element.style.position = 'absolute';
        element.style.left = '100px';
        element.style.top = '100px';
        
        element.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('resize-handle')) return; // skip if resizing
            let shiftX = e.clientX - element.getBoundingClientRect().left;
            let shiftY = e.clientY - element.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                element.style.left = pageX - shiftX + 'px';
                element.style.top = pageY - shiftY + 'px';
            }

            function onMouseMove(e) {
                moveAt(e.pageX, e.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            document.onmouseup = function() {
                document.removeEventListener('mousemove', onMouseMove);
                document.onmouseup = null;
            };
        });
        element.ondragstart = () => false;
        
        return element;
    }

    // Properties panel update
    function updatePropertiesPanel(element) {
        const type = element.querySelector('h2, p, button, img, hr').tagName.toLowerCase();
        let propertiesHTML = '';
        
        // Common color properties
        const colorProperties = `
            <div class="property">
                <label>Text Color:</label>
                <input type="color" value="${getComputedStyle(element).color}" 
                       onchange="updateElement(this.value, 'textColor')">
            </div>
            <div class="property">
                <label>Background Color:</label>
                <input type="color" value="${getComputedStyle(element).backgroundColor}" 
                       onchange="updateElement(this.value, 'backgroundColor')">
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
        }
        
        propertiesContent.innerHTML = propertiesHTML;
    }

    // Update element properties
    window.updateElement = function(value, property) {
        if (!selectedElement) return;
        
        const element = selectedElement.querySelector('h2, p, button, img, hr');
        switch(property) {
            case 'text':
                element.textContent = value;
                break;
            case 'size':
                const newElement = document.createElement(value);
                newElement.textContent = element.textContent;
                element.parentNode.replaceChild(newElement, element);
                break;
            case 'style':
                element.className = value;
                break;
            case 'src':
                element.src = value;
                break;
            case 'alt':
                element.alt = value;
                break;
            case 'textColor':
                element.style.color = value;
                break;
            case 'backgroundColor':
                element.style.backgroundColor = value;
                break;
            case 'borderColor':
                if (element.tagName.toLowerCase() === 'hr') {
                    element.style.borderColor = value;
                } else {
                    element.style.border = `1px solid ${value}`;
                }
                break;
        }
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

    // Generate HTML
    function generateHTML() {
        const elements = canvas.querySelectorAll('.draggable');
        let html = '<!DOCTYPE html>\n<html>\n<head>\n\t<title>Generated Website</title>\n\t<style>\n\t\tbody { font-family: Arial, sans-serif; }\n\t\t.btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }\n\t\t.btn.primary { background-color: #646cff; color: white; }\n';
        
        // Add custom styles for each element
        elements.forEach((element, index) => {
            const innerElement = element.querySelector('h2, p, button, img, hr');
            if (innerElement) {
                html += `\t\t.element-${index} {`;
                if (innerElement.style.color) html += `\n\t\t\tcolor: ${innerElement.style.color};`;
                if (innerElement.style.backgroundColor) html += `\n\t\t\tbackground-color: ${innerElement.style.backgroundColor};`;
                if (innerElement.style.borderColor) html += `\n\t\t\tborder-color: ${innerElement.style.borderColor};`;
                html += '\n\t\t}\n';
            }
        });
        
        html += '\t</style>\n</head>\n<body>\n';
        
        elements.forEach((element, index) => {
            const content = element.innerHTML.replace(/<button class="remove-btn">.*?<\/button>/s, '');
            const innerElement = element.querySelector('h2, p, button, img, hr');
            if (innerElement) {
                const tagName = innerElement.tagName.toLowerCase();
                // Get position and size
                const left = element.style.left || '0px';
                const top = element.style.top || '0px';
                const width = element.style.width || element.offsetWidth + 'px';
                const height = element.style.height || element.offsetHeight + 'px';
                // Inline style for absolute positioning
                const style = `position:absolute;left:${left};top:${top};width:${width};height:${height};`;
                html += `\t<${tagName} style="${style}">${innerElement.innerHTML}</${tagName}>\n`;
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

    // 5 template data objects
    const templates = [
        // Template 1: Simple Landing
        [
            {type: 'heading', text: 'Welcome to Lorem Ipsum', left: 200, top: 80, width: 400, height: 60, color: '#fff'},
            {type: 'paragraph', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod.', left: 200, top: 160, width: 400, height: 60, color: '#ccc'},
            {type: 'button', text: 'Get Started', left: 200, top: 240, width: 180, height: 50},
            {type: 'image', src: 'https://via.placeholder.com/300x200', left: 650, top: 120, width: 300, height: 200}
        ],
        // Template 2: Blog
        [
            {type: 'heading', text: 'Blog Title', left: 100, top: 60, width: 300, height: 50, color: '#fff'},
            {type: 'paragraph', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', left: 100, top: 130, width: 500, height: 50, color: '#ccc'},
            {type: 'divider', left: 100, top: 200, width: 500, height: 2},
            {type: 'heading', text: 'Post 1', left: 100, top: 220, width: 200, height: 40, color: '#fff'},
            {type: 'paragraph', text: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', left: 100, top: 270, width: 500, height: 50, color: '#ccc'}
        ],
        // Template 3: Portfolio
        [
            {type: 'heading', text: 'Jane Doe', left: 350, top: 60, width: 300, height: 50, color: '#fff'},
            {type: 'paragraph', text: 'Web Designer & Developer', left: 350, top: 120, width: 300, height: 40, color: '#ccc'},
            {type: 'image', src: 'https://via.placeholder.com/200x200', left: 100, top: 100, width: 200, height: 200},
            {type: 'button', text: 'Contact Me', left: 350, top: 180, width: 180, height: 50}
        ],
        // Template 4: Business Card
        [
            {type: 'heading', text: 'ACME Corp.', left: 250, top: 100, width: 300, height: 50, color: '#fff'},
            {type: 'paragraph', text: 'Innovating the future. Lorem ipsum dolor sit amet.', left: 250, top: 160, width: 300, height: 40, color: '#ccc'},
            {type: 'button', text: 'Learn More', left: 250, top: 220, width: 180, height: 50},
            {type: 'divider', left: 250, top: 290, width: 300, height: 2}
        ],
        // Template 5: Simple About
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
            if (elData.color) el.querySelector('h2, p, button, hr').style.color = elData.color;
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
        // Default element data, snapped to grid
        const elData = {
            type,
            text: type === 'heading' ? 'New Heading' : type === 'paragraph' ? 'New paragraph text' : type === 'button' ? 'New Button' : '',
            src: type === 'image' ? 'https://via.placeholder.com/300x200' : '',
            left: snap(initialPos.x),
            top: snap(initialPos.y),
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

        // Need to attach to DOM to get offsetWidth/Height if not explicitly set
         // This might cause a flicker, need to optimize later
         // For now, use default sizes or require explicit size setting
         // elData.width = snap(el.offsetWidth);
         // elData.height = snap(el.offsetHeight);

        renderCanvas(); // Re-render to show updated state
        return el;
    }

    // Modify createElement to add resize handle and snap logic
    const originalCreateElement = createElement;
    createElement = function(type) {
        const element = originalCreateElement(type);

        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        element.appendChild(resizeHandle);

        // Snap-to-grid function (defined globally now)
        // const gridSize = 32; // Must match CSS grid size
        // const snap = (val) => Math.round(val / gridSize) * gridSize;

        // Modify drag logic for snap-to-grid and data update
        element.addEventListener('mousedown', function(e) {
            if (e.target.classList.contains('resize-handle')) return; // skip if resizing
            if (!element.classList.contains('draggable')) return; // Only apply to draggable elements

            e.preventDefault(); // Prevent default drag behavior

            let shiftX = e.clientX - element.getBoundingClientRect().left;
            let shiftY = e.clientY - element.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                let newLeft = pageX - shiftX;
                let newTop = pageY - shiftY;

                // Snap position to grid
                element.style.left = snap(newLeft) + 'px';
                element.style.top = snap(newTop) + 'px';
            }

            function onMouseMove(e) {
                moveAt(e.clientX, e.clientY);
            }

            document.addEventListener('mousemove', onMouseMove);

            document.onmouseup = function() {
                document.removeEventListener('mousemove', onMouseMove);
                document.onmouseup = null;
                // Store updated position in data
                const page = pages[currentPageIdx];
                const section = page.sections[currentSectionIdx];
                const elData = section.elements.find(data => data.id === element.dataset.id); // Use data-id for lookup
                if (elData) {
                    elData.left = parseInt(element.style.left);
                    elData.top = parseInt(element.style.top);
                     // Trigger a re-render to ensure data is synced with canvas state visually
                     // renderCanvas(); // Avoid re-rendering during drag
                }
            };
        });
        // element.ondragstart = () => false; // Prevent native drag - already done in createElementAndStore

        // Add resize logic with snap-to-grid and data update
        resizeHandle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            e.preventDefault(); // Prevent default drag behavior

            let startX = e.clientX;
            let startY = e.clientY;
            let startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            let startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);

            function doDrag(e) {
                let newWidth = startWidth + e.clientX - startX;
                let newHeight = startHeight + e.clientY - startY;

                // Ensure minimum size and snap to grid
                element.style.width = snap(Math.max(newWidth, gridSize)) + 'px'; // Minimum size is one grid unit
                element.style.height = snap(Math.max(newHeight, gridSize)) + 'px'; // Minimum size is one grid unit
            }

            function stopDrag() {
                document.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', stopDrag);
                 // Store updated size in data
                 const page = pages[currentPageIdx];
                 const section = page.sections[currentSectionIdx];
                 const elData = section.elements.find(data => data.id === element.dataset.id);
                 if (elData) {
                     elData.width = parseInt(element.style.width);
                     elData.height = parseInt(element.style.height);
                     // Trigger a re-render to ensure data is synced
                     // renderCanvas(); // Avoid re-rendering during resize
                 }
            }

            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
        });

        // The unique ID is now assigned in createElementAndStore
        // if (!element.dataset.id) {
        //      element.dataset.id = Math.random().toString(36).substr(2, 9);
        // }

        return element;
    };

    // Override drop event listener to use createElementAndStore
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const elementType = e.dataTransfer.getData('text/plain');
        if (elementType) {
            // Get drop position relative to canvas
            const canvasRect = canvas.getBoundingClientRect();
            const dropX = e.clientX - canvasRect.left;
            const dropY = e.clientY - canvasRect.top;

            // Use createElementAndStore to create, store, and add to DOM
            createElementAndStore(elementType, { x: dropX, y: dropY });

             // The element is added and data stored within createElementAndStore now
             // const element = createElement(elementType);
             // // Set initial position snapped to grid
             // element.style.left = Math.round(dropX / gridSize) * gridSize + 'px';
             // element.style.top = Math.round(dropY / gridSize) * gridSize + 'px';
             // canvas.appendChild(element);

             // // Store initial position and size in data (create element data here instead of createElementAndStore)
             // const page = pages[currentPageIdx];
             //  if (page.sections.length) {
             //      const section = page.sections[currentSectionIdx];
             //      const elData = {
             //          type: elementType,
             //          text: elementType === 'heading' ? 'New Heading' : elementType === 'paragraph' ? 'New paragraph text' : elementType === 'button' ? 'New Button' : '',
             //          src: elementType === 'image' ? 'https://via.placeholder.com/300x200' : '',
             //          left: parseInt(element.style.left),
             //          top: parseInt(element.style.top),
             //          width: parseInt(element.style.width || element.offsetWidth),
             //          height: parseInt(element.style.height || element.offsetHeight),
             //          color: undefined,
             //          id: element.dataset.id // Store the generated ID
             //      };
             //      section.elements.push(elData);
             //  }
        }
    });

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
             if (elData.color) el.querySelector('h2, p, button, hr').style.color = elData.color; // Apply color to relevant inner elements
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

    // Update updateElement to store changes in data and trigger re-render
    const originalUpdateElement = window.updateElement;
    window.updateElement = function(value, property) {
         if (!selectedElement) return;

         const page = pages[currentPageIdx];
         if (!page.sections.length) return;
         const section = page.sections[currentSectionIdx];
         const elData = section.elements.find(data => data.id === selectedElement.dataset.id);

         if (elData) {
             switch(property) {
                 case 'text':
                     // Handled by inline editing blur now
                     // const innerEl = selectedElement.querySelector('h2, p, button');
                     // if (innerEl) innerEl.textContent = value;
                     // elData.text = value;
                     break;
                 case 'size':
                     // Recreate element for size change (h1, h2, h3)
                     // This part is complex with data, maybe handle size via width/height property?
                     // For now, let's just change the tag in the DOM and update type in data
                     const oldInnerEl = selectedElement.querySelector('h2, p');
                     if (oldInnerEl) {
                        const newInnerEl = document.createElement(value);
                        newInnerEl.textContent = oldInnerEl.textContent;
                        oldInnerEl.parentNode.replaceChild(newInnerEl, oldInnerEl);
                        elData.type = value; // Update stored type
                         // Need to update properties panel because tag changed
                         updatePropertiesPanel(selectedElement);
                     }
                     break;
                 case 'style': // For buttons
                     const btnEl = selectedElement.querySelector('button');
                     if (btnEl) btnEl.className = value;
                     // Need to store button class in data?
                     elData.style = value; // Store button style class
                     break;
                 case 'src':
                     const imgEl = selectedElement.querySelector('img');
                     if (imgEl) imgEl.src = value;
                     elData.src = value;
                     // Update properties panel to show new src
                      updatePropertiesPanel(selectedElement);
                     break;
                 case 'alt':
                     const imgElAlt = selectedElement.querySelector('img');
                     if (imgElAlt) imgElAlt.alt = value;
                     elData.alt = value;
                     break;
                 case 'textColor':
                      const textEls = selectedElement.querySelectorAll('h2, p, button, hr'); // Apply to all potential text elements
                      textEls.forEach(el => el.style.color = value);
                      elData.color = value;
                      break;
                 case 'backgroundColor':
                      selectedElement.style.backgroundColor = value;
                      elData.backgroundColor = value;
                      break;
                 case 'borderColor':
                      // Apply border color to the element container div
                      selectedElement.style.borderColor = value;
                      // If inner is HR, also apply to HR
                      const hrEl = selectedElement.querySelector('hr');
                      if (hrEl) hrEl.style.borderColor = value;

                      elData.borderColor = value;
                     break;
             }
             // No need to re-select here, properties panel update is manual or triggered by specific changes like size
             // updatePropertiesPanel(selectedElement);
         }

    };

    // Initial render
    renderPages();
    // Need to add a default section if none exist on load
     if (!pages[currentPageIdx].sections.length) {
         pages[currentPageIdx].sections.push({ name: 'Section 1', elements: [] });
     }
    renderSections();
    renderCanvas();
}); 