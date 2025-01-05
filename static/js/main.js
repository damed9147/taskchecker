document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    const addListModal = new bootstrap.Modal(document.getElementById('addListModal'));
    const addCardModal = new bootstrap.Modal(document.getElementById('addCardModal'));
    const editCardModal = new bootstrap.Modal(document.getElementById('editCardModal'));
    
    // Store cards data
    let cardsData = {};
    
    // Debug: Log modal elements
    const editModalElement = document.getElementById('editCardModal');
    console.log('Edit modal elements:', {
        modal: editModalElement,
        form: editModalElement.querySelector('#editCardForm'),
        fields: {
            id: editModalElement.querySelector('#editCardId'),
            title: editModalElement.querySelector('#editCardTitle'),
            description: editModalElement.querySelector('#editCardDescription'),
            dueDate: editModalElement.querySelector('#editCardDueDate'),
            assignedTo: editModalElement.querySelector('#editCardAssignedTo'),
            completionRate: editModalElement.querySelector('#editCardCompletion')
        }
    });
    
    // Load initial data
    loadLists();

    // Event listeners
    document.getElementById('addListBtn').addEventListener('click', () => addListModal.show());
    document.getElementById('saveListBtn').addEventListener('click', saveList);
    document.getElementById('saveCardBtn').addEventListener('click', saveCard);
    document.getElementById('updateCardBtn').addEventListener('click', updateCard);
    document.getElementById('deleteCardBtn').addEventListener('click', deleteCard);

    async function loadLists() {
        try {
            const response = await fetch('/api/lists');
            const lists = await response.json();
            const board = document.getElementById('board');
            board.innerHTML = '';
            
            // Store cards data
            cardsData = {}; // Reset cards data
            lists.forEach(list => {
                list.cards.forEach(card => {
                    cardsData[card.id] = card;
                });
            });
            
            lists.forEach(list => {
                const listElement = createListElement(list);
                board.appendChild(listElement);
            });

            // Initialize drag and drop
            initializeDragAndDrop();
        } catch (error) {
            console.error('Error loading lists:', error);
        }
    }

    function createListElement(list) {
        const listDiv = document.createElement('div');
        listDiv.className = 'list';
        listDiv.dataset.listId = list.id;
        
        listDiv.innerHTML = `
            <div class="list-header">
                <h6 class="list-title">${list.title}</h6>
                <button class="btn btn-sm btn-outline-danger delete-list-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="cards-container">
                ${list.cards.map(card => createCardHTML(card)).join('')}
            </div>
            <button class="btn btn-light add-card-btn mt-2">
                <i class="fas fa-plus"></i> Add Card
            </button>
        `;

        // Add event listeners
        listDiv.querySelector('.delete-list-btn').addEventListener('click', () => deleteList(list.id));
        listDiv.querySelector('.add-card-btn').addEventListener('click', () => {
            document.getElementById('listId').value = list.id;
            addCardModal.show();
        });

        // Add click event listeners to all cards in this list
        const cards = listDiv.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Prevent opening modal when clicking delete button or during drag
                if (!e.target.closest('.delete-card-btn') && !card.classList.contains('dragging')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const cardId = card.dataset.cardId;
                    if (cardId && cardsData[cardId]) {
                        openEditCardModal(cardId);
                    }
                }
            });
        });

        return listDiv;
    }

    async function saveList() {
        const titleInput = document.getElementById('listTitle');
        const title = titleInput.value.trim();
        
        if (!title) return;

        try {
            const response = await fetch('/api/lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            });

            if (response.ok) {
                addListModal.hide();
                titleInput.value = '';
                loadLists();
            }
        } catch (error) {
            console.error('Error saving list:', error);
        }
    }

    async function deleteList(listId) {
        try {
            const response = await fetch(`/api/lists/${listId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadLists();
            }
        } catch (error) {
            console.error('Error deleting list:', error);
        }
    }

    function createCardHTML(card) {
        const dueDate = card.due_date ? new Date(card.due_date).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'No due date';

        const isComplete = card.completion_rate === 100;
        const progressClass = isComplete ? 'bg-success' : '';
        
        return `
            <div class="card" data-card-id="${card.id}" draggable="true">
                <div class="card-title">
                    <i class="fas fa-tasks me-2"></i>${card.title}
                </div>
                <div class="card-description">
                    ${card.description || 'No description'}
                </div>
                <div class="card-meta">
                    <div>
                        <i class="fas fa-calendar-alt"></i>
                        ${dueDate}
                    </div>
                    <div>
                        <i class="fas fa-user"></i>
                        ${card.assigned_to || 'Unassigned'}
                    </div>
                    <div>
                        <i class="fas fa-chart-line"></i>
                        Progress: ${card.completion_rate}%
                        <div class="progress">
                            <div class="progress-bar ${progressClass}" 
                                 role="progressbar" 
                                 style="width: ${card.completion_rate}%"
                                 aria-valuenow="${card.completion_rate}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function openEditCardModal(cardId) {
        const card = cardsData[cardId];
        if (!card) {
            console.error('Card not found:', cardId);
            return;
        }

        const modalElement = document.getElementById('editCardModal');
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }

        // Debug: Log modal HTML
        console.log('Modal HTML:', modalElement.innerHTML);

        // Add event listener for when modal is shown
        modalElement.addEventListener('shown.bs.modal', function setModalFields() {
            // Debug: Log modal form fields
            const form = modalElement.querySelector('#editCardForm');
            console.log('Form fields:', {
                form: form,
                inputs: form ? Array.from(form.querySelectorAll('input, textarea')).map(el => ({
                    id: el.id,
                    name: el.name,
                    type: el.type
                })) : []
            });

            // Set form field values using querySelector within the modal
            const setField = (selector, value) => {
                const element = modalElement.querySelector(selector);
                if (element) {
                    element.value = value;
                    console.log(`Set ${selector} to:`, value); // Debug log
                } else {
                    console.error(`Element not found: ${selector}`);
                    // Debug: Try finding it without the #
                    const altElement = modalElement.querySelector(selector.replace('#', ''));
                    console.log(`Tried finding without #:`, altElement);
                }
            };

            // Set each field
            setField('#editCardId', cardId);
            setField('#editCardTitle', card.title || '');
            setField('#editCardDescription', card.description || '');
            setField('#editCardDueDate', card.due_date ? card.due_date.slice(0, 16) : '');
            setField('#editCardAssignedTo', card.assigned_to || '');
            setField('#editCardCompletion', card.completion_rate || 0);

            // Remove the event listener
            modalElement.removeEventListener('shown.bs.modal', setModalFields);
        });

        editCardModal.show();
    }

    async function updateCard() {
        const modalElement = document.getElementById('editCardModal');
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }

        const getValue = (selector) => {
            const element = modalElement.querySelector(selector);
            return element ? element.value : null;
        };

        const cardId = getValue('#editCardId');
        if (!cardId) {
            console.error('Card ID not found');
            return;
        }

        const card = {
            title: getValue('#editCardTitle') || '',
            description: getValue('#editCardDescription') || '',
            due_date: getValue('#editCardDueDate') || '',
            assigned_to: getValue('#editCardAssignedTo') || '',
            completion_rate: parseInt(getValue('#editCardCompletion')) || 0
        };

        try {
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(card)
            });

            if (response.ok) {
                // Clear focus before hiding modal
                document.activeElement.blur();
                
                // Hide modal
                editCardModal.hide();
                
                // Wait for modal to be hidden before reloading lists
                setTimeout(() => {
                    loadLists();
                }, 300);
            } else {
                console.error('Failed to update card');
            }
        } catch (error) {
            console.error('Error updating card:', error);
        }
    }

    async function deleteCard() {
        const cardId = document.getElementById('editCardId').value;
        
        try {
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Clear focus before hiding modal
                document.activeElement.blur();
                
                // Hide modal
                editCardModal.hide();
                
                // Wait for modal to be hidden before reloading lists
                setTimeout(() => {
                    loadLists();
                }, 300);
            } else {
                console.error('Failed to delete card');
            }
        } catch (error) {
            console.error('Error deleting card:', error);
        }
    }

    async function saveCard() {
        const listId = document.getElementById('listId').value;
        const card = {
            title: document.getElementById('cardTitle').value,
            description: document.getElementById('cardDescription').value,
            due_date: document.getElementById('cardDueDate').value,
            assigned_to: document.getElementById('cardAssignedTo').value,
            completion_rate: parseInt(document.getElementById('cardCompletion').value),
            list_id: parseInt(listId)
        };

        try {
            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(card)
            });

            if (response.ok) {
                // Clear focus before hiding modal
                document.activeElement.blur();
                
                // Hide modal and reset form
                addCardModal.hide();
                document.getElementById('cardTitle').value = '';
                document.getElementById('cardDescription').value = '';
                document.getElementById('cardDueDate').value = '';
                document.getElementById('cardAssignedTo').value = '';
                document.getElementById('cardCompletion').value = '0';
                
                // Wait for modal to be hidden before reloading lists
                setTimeout(() => {
                    loadLists();
                }, 300);
            }
        } catch (error) {
            console.error('Error saving card:', error);
        }
    }

    // Initialize drag and drop functionality
    function initializeDragAndDrop() {
        const lists = document.querySelectorAll('.list');
        lists.forEach(list => {
            const container = list.querySelector('.cards-container');
            new Sortable(container, {
                group: 'cards',
                animation: 150,
                onEnd: handleCardDrop
            });
        });
    }

    async function handleCardDrop(event) {
        if (!event.from || !event.to) return;
        
        const cardId = event.item.dataset.cardId;
        const newListId = event.to.closest('.list').dataset.listId;
        const newPosition = Array.from(event.to.children).indexOf(event.item);

        try {
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    list_id: newListId,
                    position: newPosition
                })
            });

            if (!response.ok) {
                console.error('Failed to update card position');
                loadLists(); // Reload to restore original state
            }
        } catch (error) {
            console.error('Error updating card position:', error);
            loadLists(); // Reload to restore original state
        }
    }
});
