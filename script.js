// Money Tycoon - Incremental Game JavaScript
// Game State
let gameState = {
    money: 0,
    totalEarned: 0,
    totalClicks: 0,
    timePlayed: 0,
    prestigePoints: 0,
    prestigeMultiplier: 1,
    totalPrestiges: 0,
    
    // Click upgrades
    clickPower: 1,
    clickLevel: 0,
    critChance: 0,
    critLevel: 0,
    
    // Businesses
    businesses: {
        lemonade: { owned: 0, cost: 100, revenue: 1, baseRevenue: 1, baseCost: 100 },
        pizza: { owned: 0, cost: 1100, revenue: 8, baseRevenue: 8, baseCost: 1100 },
        arcade: { owned: 0, cost: 12000, revenue: 47, baseRevenue: 47, baseCost: 12000 },
        oil: { owned: 0, cost: 130000, revenue: 260, baseRevenue: 260, baseCost: 130000 },
        bank: { owned: 0, cost: 1400000, revenue: 1400, baseRevenue: 1400, baseCost: 1400000 },
        space: { owned: 0, cost: 20000000, revenue: 7800, baseRevenue: 7800, baseCost: 20000000 }
    },
    
    // Settings
    currentTheme: 'default',
    autoSave: true,
    
    // Statistics
    sessionStartTime: Date.now(),
    totalMoneyFromClicks: 0,
    totalMoneyFromBusinesses: 0,
    biggestClick: 0
};

// Achievements system
const achievements = [
    {
        id: 'first_click',
        name: '🖱️ First Click',
        description: 'Click the money button for the first time',
        condition: () => gameState.totalClicks >= 1,
        reward: 'Click power +1',
        unlocked: false
    },
    {
        id: 'hundred_clicks',
        name: '💯 Century Clicker',
        description: 'Click 100 times',
        condition: () => gameState.totalClicks >= 100,
        reward: 'Click power +5',
        unlocked: false
    },
    {
        id: 'thousand_clicks',
        name: '🔥 Click Master',
        description: 'Click 1,000 times',
        condition: () => gameState.totalClicks >= 1000,
        reward: 'Click power +25',
        unlocked: false
    },
    {
        id: 'first_business',
        name: '🏪 Entrepreneur',
        description: 'Buy your first business',
        condition: () => getTotalBusinesses() >= 1,
        reward: 'All business revenue +10%',
        unlocked: false
    },
    {
        id: 'ten_businesses',
        name: '🏢 Business Empire',
        description: 'Own 10 businesses total',
        condition: () => getTotalBusinesses() >= 10,
        reward: 'All business revenue +25%',
        unlocked: false
    },
    {
        id: 'millionaire',
        name: '💰 Millionaire',
        description: 'Earn $1,000,000',
        condition: () => gameState.totalEarned >= 1000000,
        reward: 'Prestige bonus +0.1x',
        unlocked: false
    },
    {
        id: 'billionaire',
        name: '💎 Billionaire',
        description: 'Earn $1,000,000,000',
        condition: () => gameState.totalEarned >= 1000000000,
        reward: 'All income +50%',
        unlocked: false
    },
    {
        id: 'first_prestige',
        name: '⭐ Ascending',
        description: 'Prestige for the first time',
        condition: () => gameState.totalPrestiges >= 1,
        reward: 'Prestige efficiency +10%',
        unlocked: false
    },
    {
        id: 'speed_demon',
        name: '⚡ Speed Demon',
        description: 'Earn $1000/second',
        condition: () => getMoneyPerSecond() >= 1000,
        reward: 'All passive income +20%',
        unlocked: false
    },
    {
        id: 'big_spender',
        name: '🛍️ Big Spender',
        description: 'Spend $10,000,000 total',
        condition: () => (gameState.totalEarned - gameState.money) >= 10000000,
        reward: 'All upgrades 5% cheaper',
        unlocked: false
    }
];

// Game initialization
window.addEventListener('load', function() {
    loadGame();
    updateDisplay();
    startGameLoop();
    renderAchievements();
    applyTheme(gameState.currentTheme);
    
    // Auto-save every 30 seconds
    setInterval(() => {
        if (gameState.autoSave) {
            saveGame();
        }
    }, 30000);
});

// Main game loop
function startGameLoop() {
    setInterval(() => {
        // Update time played
        gameState.timePlayed = Math.floor((Date.now() - gameState.sessionStartTime) / 1000);
        
        // Generate passive income
        const passiveIncome = getMoneyPerSecond();
        if (passiveIncome > 0) {
            addMoney(passiveIncome / 10); // 10 times per second
        }
        
        // Update display
        updateDisplay();
        
        // Check achievements
        checkAchievements();
        
        // Update upgrade availability
        updateUpgradeButtons();
        
    }, 100); // Run 10 times per second for smooth updates
}

// Core game functions
function clickButton() {
    const button = document.getElementById('main-button');
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 200);
    
    let clickValue = gameState.clickPower * gameState.prestigeMultiplier;
    
    // Apply achievement bonuses
    clickValue *= getAchievementMultiplier('click');
    
    // Critical hit chance
    const isCritical = Math.random() < (gameState.critChance / 100);
    if (isCritical) {
        clickValue *= 10;
        showFloatingNumber(clickValue, true);
        createParticles(button);
    } else {
        showFloatingNumber(clickValue, false);
    }
    
    // Track biggest click
    if (clickValue > gameState.biggestClick) {
        gameState.biggestClick = clickValue;
    }
    
    addMoney(clickValue);
    gameState.totalClicks++;
    gameState.totalMoneyFromClicks += clickValue;
    
    // Create click effect
    createClickEffect(event);
}

function addMoney(amount) {
    gameState.money += amount;
    gameState.totalEarned += amount;
}

function getMoneyPerSecond() {
    let total = 0;
    const businessMultiplier = getAchievementMultiplier('business');
    const passiveMultiplier = getAchievementMultiplier('passive');
    
    for (const [key, business] of Object.entries(gameState.businesses)) {
        total += business.owned * business.revenue * businessMultiplier * passiveMultiplier;
    }
    
    return total * gameState.prestigeMultiplier;
}

function getTotalBusinesses() {
    return Object.values(gameState.businesses).reduce((sum, business) => sum + business.owned, 0);
}

// Upgrade functions
function buyUpgrade(type) {
    if (type === 'click') {
        const cost = getClickUpgradeCost();
        if (gameState.money >= cost) {
            gameState.money -= cost;
            gameState.clickLevel++;
            gameState.clickPower += Math.floor(gameState.clickLevel * 1.5) + 1;
            showNotification('💪 Click power increased!', 'success');
            updateDisplay();
        }
    } else if (type === 'crit') {
        const cost = getCritUpgradeCost();
        if (gameState.money >= cost) {
            gameState.money -= cost;
            gameState.critLevel++;
            gameState.critChance = Math.min(gameState.critLevel * 5, 50); // Max 50% crit chance
            showNotification('🎯 Critical hit chance increased!', 'success');
            updateDisplay();
        }
    }
}

function buyBusiness(type) {
    const business = gameState.businesses[type];
    const cost = business.cost;
    
    if (gameState.money >= cost) {
        gameState.money -= cost;
        business.owned++;
        
        // Increase cost (exponential scaling)
        business.cost = Math.floor(business.baseCost * Math.pow(1.15, business.owned));
        
        showNotification(`🏢 Bought ${getBusinessName(type)}!`, 'success');
        updateDisplay();
    }
}

// Cost calculation functions
function getClickUpgradeCost() {
    const discountMultiplier = hasAchievement('big_spender') ? 0.95 : 1;
    return Math.floor(25 * Math.pow(1.8, gameState.clickLevel) * discountMultiplier);
}

function getCritUpgradeCost() {
    const discountMultiplier = hasAchievement('big_spender') ? 0.95 : 1;
    return Math.floor(500 * Math.pow(2.2, gameState.critLevel) * discountMultiplier);
}

function getBusinessName(type) {
    const names = {
        lemonade: 'Lemonade Stand',
        pizza: 'Pizza Shop',
        arcade: 'Arcade',
        oil: 'Oil Company',
        bank: 'Investment Bank',
        space: 'Space Program'
    };
    return names[type] || type;
}

// Prestige system
function prestige() {
    if (gameState.money < 1000000) {
        showNotification('❌ Need $1,000,000 to prestige!', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to prestige? This will reset your progress but give you permanent bonuses!')) {
        // Calculate prestige points
        const newPoints = Math.floor(gameState.money / 1000000);
        gameState.prestigePoints += newPoints;
        gameState.totalPrestiges++;
        
        // Calculate new multiplier
        gameState.prestigeMultiplier = 1 + (gameState.prestigePoints * 0.1);
        
        // Apply achievement bonuses
        if (hasAchievement('millionaire')) {
            gameState.prestigeMultiplier += 0.1;
        }
        if (hasAchievement('first_prestige')) {
            gameState.prestigeMultiplier *= 1.1;
        }
        
        // Reset game state
        resetForPrestige();
        
        showNotification(`⭐ Prestiged! Gained ${newPoints} prestige points!`, 'success');
        updateDisplay();
    }
}

function resetForPrestige() {
    gameState.money = 0;
    gameState.totalClicks = 0;
    gameState.clickPower = 1;
    gameState.clickLevel = 0;
    gameState.critChance = 0;
    gameState.critLevel = 0;
    
    // Reset businesses
    for (const business of Object.values(gameState.businesses)) {
        business.owned = 0;
        business.cost = business.baseCost;
    }
}

// Achievement system
function checkAchievements() {
    achievements.forEach(achievement => {
        if (!achievement.unlocked && achievement.condition()) {
            achievement.unlocked = true;
            applyAchievementReward(achievement);
            showNotification(`🏆 Achievement Unlocked: ${achievement.name}`, 'success');
        }
    });
}

function applyAchievementReward(achievement) {
    switch (achievement.id) {
        case 'first_click':
            gameState.clickPower += 1;
            break;
        case 'hundred_clicks':
            gameState.clickPower += 5;
            break;
        case 'thousand_clicks':
            gameState.clickPower += 25;
            break;
    }
}

function hasAchievement(id) {
    const achievement = achievements.find(a => a.id === id);
    return achievement && achievement.unlocked;
}

function getAchievementMultiplier(type) {
    let multiplier = 1;
    
    if (type === 'click') {
        // Click-specific multipliers
        return multiplier;
    } else if (type === 'business') {
        if (hasAchievement('first_business')) multiplier *= 1.1;
        if (hasAchievement('ten_businesses')) multiplier *= 1.25;
        return multiplier;
    } else if (type === 'passive') {
        if (hasAchievement('speed_demon')) multiplier *= 1.2;
        if (hasAchievement('billionaire')) multiplier *= 1.5;
        return multiplier;
    }
    
    return multiplier;
}

// Display update functions
function updateDisplay() {
    // Update money displays
    document.getElementById('money').textContent = formatNumber(gameState.money);
    document.getElementById('per-second').textContent = formatNumber(getMoneyPerSecond());
    document.getElementById('total-earned').textContent = formatNumber(gameState.totalEarned);
    
    // Update prestige display
    document.getElementById('prestige-points').textContent = gameState.prestigePoints;
    document.getElementById('prestige-multiplier').textContent = gameState.prestigeMultiplier.toFixed(2);
    
    // Update prestige button
    const prestigeBtn = document.getElementById('prestige-btn');
    if (gameState.money >= 1000000) {
        prestigeBtn.disabled = false;
        prestigeBtn.textContent = `Prestige (+${Math.floor(gameState.money / 1000000)} points)`;
    } else {
        prestigeBtn.disabled = true;
        prestigeBtn.textContent = 'Prestige (Requires $1M)';
    }
    
    // Update click button
    document.getElementById('click-value').textContent = formatNumber(gameState.clickPower * gameState.prestigeMultiplier);
    
    // Update quick stats
    document.getElementById('total-clicks').textContent = formatNumber(gameState.totalClicks);
    document.getElementById('time-played').textContent = formatTime(gameState.timePlayed);
    document.getElementById('click-power-display').textContent = formatNumber(gameState.clickPower * gameState.prestigeMultiplier);
    document.getElementById('total-businesses').textContent = getTotalBusinesses();
    
    // Update upgrade costs and levels
    document.getElementById('click-cost').textContent = formatNumber(getClickUpgradeCost());
    document.getElementById('click-level').textContent = gameState.clickLevel;
    document.getElementById('crit-cost').textContent = formatNumber(getCritUpgradeCost());
    document.getElementById('crit-level').textContent = gameState.critLevel;
    
    // Update business displays
    for (const [key, business] of Object.entries(gameState.businesses)) {
        document.getElementById(`${key}-cost`).textContent = formatNumber(business.cost);
        document.getElementById(`${key}-owned`).textContent = business.owned;
    }
    
    // Update settings stats
    document.getElementById('session-time').textContent = formatTime(gameState.timePlayed);
    document.getElementById('stats-click-value').textContent = formatNumber(gameState.clickPower * gameState.prestigeMultiplier);
    document.getElementById('stats-per-second').textContent = formatNumber(getMoneyPerSecond());
    document.getElementById('stats-total-clicks').textContent = formatNumber(gameState.totalClicks);
}

function updateUpgradeButtons() {
    // Update click upgrade button
    const clickBtn = document.querySelector('#click-upgrade .upgrade-btn');
    clickBtn.disabled = gameState.money < getClickUpgradeCost();
    
    // Update crit upgrade button
    const critBtn = document.querySelector('#crit-upgrade .upgrade-btn');
    critBtn.disabled = gameState.money < getCritUpgradeCost();
    
    // Update business buttons
    for (const [key, business] of Object.entries(gameState.businesses)) {
        const btn = document.querySelector(`#${key}-upgrade .upgrade-btn`);
        btn.disabled = gameState.money < business.cost;
    }
}

// Visual effects
function showFloatingNumber(amount, isCritical = false) {
    const button = document.getElementById('main-button');
    const rect = button.getBoundingClientRect();
    
    const floatingNumber = document.createElement('div');
    floatingNumber.className = `floating-number${isCritical ? ' critical' : ''}`;
    floatingNumber.textContent = `+$${formatNumber(amount)}`;
    floatingNumber.style.left = `${rect.left + rect.width / 2}px`;
    floatingNumber.style.top = `${rect.top}px`;
    
    document.body.appendChild(floatingNumber);
    
    setTimeout(() => {
        document.body.removeChild(floatingNumber);
    }, 2000);
}

function createClickEffect(event) {
    if (!event) return;
    
    const clickEffect = document.createElement('div');
    clickEffect.style.position = 'absolute';
    clickEffect.style.left = `${event.clientX}px`;
    clickEffect.style.top = `${event.clientY}px`;
    clickEffect.style.width = '20px';
    clickEffect.style.height = '20px';
    clickEffect.style.borderRadius = '50%';
    clickEffect.style.background = 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%)';
    clickEffect.style.pointerEvents = 'none';
    clickEffect.style.animation = 'clickRipple 0.6s ease-out forwards';
    clickEffect.style.zIndex = '999';
    
    document.body.appendChild(clickEffect);
    
    setTimeout(() => {
        document.body.removeChild(clickEffect);
    }, 600);
}

function createParticles(element) {
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${rect.left + rect.width / 2}px`;
        particle.style.top = `${rect.top + rect.height / 2}px`;
        particle.style.transform = `rotate(${i * 45}deg) translateY(-30px)`;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            document.body.removeChild(particle);
        }, 1000);
    }
}

// Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Theme system
function changeTheme(theme) {
    gameState.currentTheme = theme;
    applyTheme(theme);
    
    // Update theme cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
    
    saveGame();
}

function applyTheme(theme) {
    document.body.className = theme === 'default' ? '' : `${theme}-theme`;
}

// Achievements rendering
function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    grid.innerHTML = '';
    
    achievements.forEach(achievement => {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        
        card.innerHTML = `
            <h4>${achievement.name}</h4>
            <p>${achievement.description}</p>
            <div class="reward">${achievement.reward}</div>
        `;
        
        grid.appendChild(card);
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const container = document.getElementById('notifications');
    container.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (container.contains(notification)) {
            container.removeChild(notification);
        }
    }, 3000);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        if (container.contains(notification)) {
            container.removeChild(notification);
        }
    });
}

// Save/Load system
function saveGame() {
    try {
        const saveData = {
            ...gameState,
            achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked }))
        };
        const encoded = btoa(JSON.stringify(saveData));
        if (typeof Storage !== 'undefined') {
            localStorage.setItem('moneyTycoonSave', encoded);
        }
        showNotification('💾 Game saved!', 'success');
    } catch (error) {
        showNotification('❌ Failed to save game!', 'error');
    }
}

function loadGame() {
    try {
        if (typeof Storage !== 'undefined') {
            const saved = localStorage.getItem('moneyTycoonSave');
            if (saved) {
                const decoded = JSON.parse(atob(saved));
                
                // Merge saved data with current state
                Object.assign(gameState, decoded);
                
                // Load achievements
                if (decoded.achievements) {
                    decoded.achievements.forEach(savedAchievement => {
                        const achievement = achievements.find(a => a.id === savedAchievement.id);
                        if (achievement) {
                            achievement.unlocked = savedAchievement.unlocked;
                        }
                    });
                }
                
                // Reset session start time
                gameState.sessionStartTime = Date.now();
                
                showNotification('📁 Game loaded!', 'success');
            }
        }
    } catch (error) {
        showNotification('❌ Failed to load game!', 'error');
    }
}

function exportSave() {
    try {
        const saveData = {
            ...gameState,
            achievements: achievements.map(a => ({ id: a.id, unlocked: a.unlocked }))
        };
        const encoded = btoa(JSON.stringify(saveData));
        
        navigator.clipboard.writeText(encoded).then(() => {
            showNotification('📤 Save data copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = encoded;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('📤 Save data copied to clipboard!', 'success');
        });
    } catch (error) {
        showNotification('❌ Failed to export save!', 'error');
    }
}

function importSave() {
    document.getElementById('import-modal').style.display = 'block';
}

function closeImportModal() {
    document.getElementById('import-modal').style.display = 'none';
    document.getElementById('import-data').value = '';
}

function doImport() {
    const importData = document.getElementById('import-data').value.trim();
    
    if (!importData) {
        showNotification('❌ No save data provided!', 'error');
        return;
    }
    
    try {
        const decoded = JSON.parse(atob(importData));
        
        // Validate the save data
        if (typeof decoded.money === 'undefined') {
            throw new Error('Invalid save data format');
        }
        
        // Load the save
        Object.assign(gameState, decoded);
        
        // Load achievements
        if (decoded.achievements) {
            decoded.achievements.forEach(savedAchievement => {
                const achievement = achievements.find(a => a.id === savedAchievement.id);
                if (achievement) {
                    achievement.unlocked = savedAchievement.unlocked;
                }
            });
        }
        
        // Reset session start time
        gameState.sessionStartTime = Date.now();
        
        updateDisplay();
        renderAchievements();
        applyTheme(gameState.currentTheme);
        
        closeImportModal();
        showNotification('📥 Save data imported successfully!', 'success');
        
    } catch (error) {
        showNotification('❌ Invalid save data!', 'error');
    }
}

function resetGame() {
    if (confirm('Are you sure you want to reset your game? This will delete all progress!')) {
        if (confirm('This action cannot be undone. Are you absolutely sure?')) {
            // Reset all game state
            gameState = {
                money: 0,
                totalEarned: 0,
                totalClicks: 0,
                timePlayed: 0,
                prestigePoints: 0,
                prestigeMultiplier: 1,
                totalPrestiges: 0,
                clickPower: 1,
                clickLevel: 0,
                critChance: 0,
                critLevel: 0,
                businesses: {
                    lemonade: { owned: 0, cost: 100, revenue: 1, baseRevenue: 1, baseCost: 100 },
                    pizza: { owned: 0, cost: 1100, revenue: 8, baseRevenue: 8, baseCost: 1100 },
                    arcade: { owned: 0, cost: 12000, revenue: 47, baseRevenue: 47, baseCost: 12000 },
                    oil: { owned: 0, cost: 130000, revenue: 260, baseRevenue: 260, baseCost: 130000 },
                    bank: { owned: 0, cost: 1400000, revenue: 1400, baseRevenue: 1400, baseCost: 1400000 },
                    space: { owned: 0, cost: 20000000, revenue: 7800, baseRevenue: 7800, baseCost: 20000000 }
                },
                currentTheme: 'default',
                autoSave: true,
                sessionStart: Date.now(),
                totalMoneyFromClicks: 0,
                totalMoneyFromBusinesses: 0,
                biggestClick: 0
            };
            
            // Reset achievements
            achievements.forEach(achievement => {
                achievement.unlocked = false;
            });
            
            // Clear localStorage
            if (typeof Storage !== 'undefined') {
                localStorage.removeItem('moneyTycoonSave');
            }
            
            updateDisplay();
            renderAchievements();
            applyTheme('default');
            
            showNotification('🗑️ Game reset successfully!', 'success');
        }
    }
}

// Utility functions
function formatNumber(num) {
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num < 1000000000000000) return (num / 1000000000000).toFixed(2) + 'T';
    return (num / 1000000000000000).toFixed(2) + 'Q';
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Add CSS animation for click ripple effect
const style = document.createElement('style');
style.textContent = `
    @keyframes clickRipple {
        0% {
            transform: scale(1);
            opacity: 0.8;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        clickButton();
    }
});

// Prevent right-click context menu on game elements
document.addEventListener('contextmenu', function(e) {
    if (e.target.closest('.main-btn') || e.target.closest('.upgrade-btn')) {
        e.preventDefault();
    }
});