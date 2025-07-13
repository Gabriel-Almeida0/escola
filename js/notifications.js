/**
 * Sistema de notificações estilizadas
 * Substitui os alertas padrão do navegador por notificações personalizadas
 */

// Função para mostrar notificação
function showNotification(title, message, type = 'info', duration = 5000) {
    // Verificar se o container de notificações existe
    let notificationContainer = document.getElementById('notificationContainer');
    
    // Se não existir, criar um
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Definir ícone baseado no tipo
    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';
    
    // Estrutura da notificação
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <p class="notification-message">${message}</p>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
        <div class="notification-progress">
            <div class="notification-progress-bar"></div>
        </div>
    `;
    
    // Adicionar ao container
    notificationContainer.appendChild(notification);
    
    // Botão para fechar notificação
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Mostrar notificação com animação
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remover após duração especificada
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }
    
    return notification;
}

// Função para mostrar notificação de sucesso
function showSuccess(message, title = 'Sucesso', duration = 5000) {
    return showNotification(title, message, 'success', duration);
}

// Função para mostrar notificação de erro
function showError(message, title = 'Erro', duration = 5000) {
    return showNotification(title, message, 'error', duration);
}

// Função para mostrar notificação de aviso
function showWarning(message, title = 'Aviso', duration = 5000) {
    return showNotification(title, message, 'warning', duration);
}

// Função para mostrar notificação de informação
function showInfo(message, title = 'Informação', duration = 5000) {
    return showNotification(title, message, 'info', duration);
}

// Função para mostrar notificação de confirmação (substitui confirm)
function showConfirm(message, title = 'Confirmação', onConfirm, onCancel) {
    const notification = showNotification(title, message, 'warning', 0);
    
    // Remover barra de progresso
    const progressBar = notification.querySelector('.notification-progress');
    if (progressBar) progressBar.remove();
    
    // Adicionar botões de confirmação
    const content = notification.querySelector('.notification-content');
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'notification-buttons';
    buttonsContainer.style.marginTop = '10px';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '10px';
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'notification-confirm-button';
    confirmButton.textContent = 'Confirmar';
    confirmButton.style.backgroundColor = '#4CAF50';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.padding = '8px 12px';
    confirmButton.style.borderRadius = '4px';
    confirmButton.style.cursor = 'pointer';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'notification-cancel-button';
    cancelButton.textContent = 'Cancelar';
    cancelButton.style.backgroundColor = '#f44336';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.padding = '8px 12px';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    
    buttonsContainer.appendChild(confirmButton);
    buttonsContainer.appendChild(cancelButton);
    content.appendChild(buttonsContainer);
    
    // Adicionar eventos aos botões
    confirmButton.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            if (typeof onConfirm === 'function') onConfirm();
        }, 300);
    });
    
    cancelButton.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            if (typeof onCancel === 'function') onCancel();
        }, 300);
    });
    
    return notification;
}

// Função para mostrar notificação de entrada (substitui prompt)
function showPrompt(message, title = 'Entrada', defaultValue = '', onSubmit, onCancel) {
    const notification = showNotification(title, message, 'info', 0);
    
    // Remover barra de progresso
    const progressBar = notification.querySelector('.notification-progress');
    if (progressBar) progressBar.remove();
    
    // Adicionar campo de entrada e botões
    const content = notification.querySelector('.notification-content');
    
    // Campo de entrada
    const inputContainer = document.createElement('div');
    inputContainer.style.marginTop = '10px';
    inputContainer.style.marginBottom = '10px';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.boxSizing = 'border-box';
    input.style.border = '1px solid #ddd';
    input.style.borderRadius = '4px';
    
    inputContainer.appendChild(input);
    content.appendChild(inputContainer);
    
    // Botões
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'notification-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '10px';
    
    const submitButton = document.createElement('button');
    submitButton.className = 'notification-submit-button';
    submitButton.textContent = 'Enviar';
    submitButton.style.backgroundColor = '#4CAF50';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.padding = '8px 12px';
    submitButton.style.borderRadius = '4px';
    submitButton.style.cursor = 'pointer';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'notification-cancel-button';
    cancelButton.textContent = 'Cancelar';
    cancelButton.style.backgroundColor = '#f44336';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.padding = '8px 12px';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    
    buttonsContainer.appendChild(submitButton);
    buttonsContainer.appendChild(cancelButton);
    content.appendChild(buttonsContainer);
    
    // Focar no campo de entrada
    setTimeout(() => {
        input.focus();
    }, 100);
    
    // Adicionar eventos aos botões
    submitButton.addEventListener('click', () => {
        const value = input.value;
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            if (typeof onSubmit === 'function') onSubmit(value);
        }, 300);
    });
    
    cancelButton.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
            if (typeof onCancel === 'function') onCancel();
        }, 300);
    });
    
    // Permitir enviar com Enter
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitButton.click();
        }
    });
    
    return notification;
} 