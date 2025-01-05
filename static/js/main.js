document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    const addListModal = new bootstrap.Modal(document.getElementById('addListModal'));
    const addCardModal = new bootstrap.Modal(document.getElementById('addCardModal'));
    const editCardModal = new bootstrap.Modal(document.getElementById('editCardModal'));
    
    // Load initial data
    loadLists();

    // Event listeners
    document.getElementById('addListBtn').addEventListener('click', () => addListModal.show());
    document.getElementById('saveListBtn').addEventListener('click', saveList);
    document.getElementById('saveCardBtn').addEventListener('click', saveCard);
    document.getElementById('updateCardBtn').addEventListener('click', updateCard);
    document.getElementById('deleteCardBtn').addEventListener('click', deleteCard);

    // Functions
    async function loadLists() {
        try {
            const response = await fetch('/api/lists');
            const lists = await response.json();
            const board = document.getElementById('board');
            board.innerHTML = '';
            
            lists.forEach(list => {
                const listElement = createListElement(list);
                board.appendChild(listElement);
                
                // Initialize Sortable for cards within this list
                new Sortable(listElement.querySelector('.cards-container'), {
                    group: 'cards',
                    animation: 150,
                    onEnd: handleCardDrop
                });
            });

            // Initialize Sortable for lists
            new Sortable(board, {
                animation: 150,
                onEnd: handleListDrop
            });
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

        listDiv.querySelectorAll('.card').forEach(cardElement => {
            cardElement.addEventListener('click', () => openEditCardModal(cardElement.dataset.cardId));
        });

        return listDiv;
    }

    function createCardHTML(card) {
        const dueDate = card.due_date ? new Date(card.due_date).toLocaleDateString() : 'No due date';
        return `
            <div class="card" data-card-id="${card.id}">
                <div class="card-title">${card.title}</div>
                <div class="card-meta">
                    <div class="mb-1">
                        <i class="fas fa-user"></i> ${card.assigned_to || 'Unassigned'}
                    </div>
                    <div class="mb-1">
                        <i class="fas fa-calendar"></i> ${dueDate}
                    </div>
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" style="width: ${card.completion_rate}%"
                             aria-valuenow="${card.completion_rate}" aria-valuemin="0" aria-valuemax="100">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function saveList() {
        const titleInput = document.getElementById('listTitle');
        const title = titleInput.value.trim();
        
        if (!title) return;

        try {
            const response = await fetch('/api/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        if (!confirm('Are you sure you want to delete this list and all its cards?')) return;

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

    async function saveCard() {
        const data = {
            list_id: parseInt(document.getElementById('listId').value),
            title: document.getElementById('cardTitle').value.trim(),
            description: document.getElementById('cardDescription').value.trim(),
            due_date: document.getElementById('cardDueDate').value,
            assigned_to: document.getElementById('cardAssignedTo').value.trim(),
            completion_rate: parseInt(document.getElementById('cardCompletion').value)
        };

        if (!data.title) return;

        try {
            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                addCardModal.hide();
                document.getElementById('addCardForm').reset();
                loadLists();
            }
        } catch (error) {
            console.error('Error saving card:', error);
        }
    }

    async function openEditCardModal(cardId) {
        const card = document.querySelector(`[data-card-id="${cardId}"]`);
        if (!card) return;

        // Populate modal with card data
        document.getElementById('editCardId').value = cardId;
        document.getElementById('editCardTitle').value = card.querySelector('.card-title').textContent;
        // Add other field population here

        editCardModal.show();
    }

    async function updateCard() {
        const cardId = document.getElementById('editCardId').value;
        const data = {
            title: document.getElementById('editCardTitle').value.trim(),
            description: document.getElementById('editCardDescription').value.trim(),
            due_date: document.getElementById('editCardDueDate').value,
            assigned_to: document.getElementById('editCardAssignedTo').value.trim(),
            completion_rate: parseInt(document.getElementById('editCardCompletion').value)
        };

        if (!data.title) return;

        try {
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                editCardModal.hide();
                loadLists();
            }
        } catch (error) {
            console.error('Error updating card:', error);
        }
    }

    async function deleteCard() {
        const cardId = document.getElementById('editCardId').value;
        if (!confirm('Are you sure you want to delete this card?')) return;

        try {
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                editCardModal.hide();
                loadLists();
            }
        } catch (error) {
            console.error('Error deleting card:', error);
        }
    }

    async function handleCardDrop(event) {
        const cardId = event.item.dataset.cardId;
        const newListId = event.to.closest('.list').dataset.listId;
        const newPosition = Array.from(event.to.children).indexOf(event.item);

        try {
            await fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    list_id: parseInt(newListId),
                    position: newPosition
                })
            });
        } catch (error) {
            console.error('Error updating card position:', error);
            loadLists(); // Reload to restore original state
        }
    }

    async function handleListDrop(event) {
        const listId = event.item.dataset.listId;
        const newPosition = Array.from(event.to.children).indexOf(event.item);

        try {
            await fetch(`/api/lists/${listId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    position: newPosition
                })
            });
        } catch (error) {
            console.error('Error updating list position:', error);
            loadLists(); // Reload to restore original state
        }
    }
});
