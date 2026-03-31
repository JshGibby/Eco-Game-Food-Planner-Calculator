import { getFilteredFoods, toggleFood, isEnabled, getAllFoods, setEnabledFoods, getEnabledFoods } from './filters.js';
import { generateOptimalPlans, generateRandomPlanOnly } from './planGenerator.js';
import { drawPie, displayPlan, renderPlanList } from './ui.js';

let currentOptimalPlans = [];
let selectedPlanIndex = -1;

function getCurrentNutrients() {
    return {
        carbs: parseFloat(document.getElementById('carbs').value) || 0,
        protein: parseFloat(document.getElementById('protein').value) || 0,
        fat: parseFloat(document.getElementById('fat').value) || 0,
        vitamins: parseFloat(document.getElementById('vitamins').value) || 0
    };
}

function getMaxRemainingCalories() {
    const curCal = parseFloat(document.getElementById('curCalories').value) || 0;
    const maxCal = parseFloat(document.getElementById('maxCalories').value) || 3000;
    const ignoreLimit = document.getElementById('ignoreCalorieLimit').checked;
    if (ignoreLimit) return Infinity;
    return Math.max(0, maxCal - curCal);
}

async function generateAndShowPlans() {
    const current = getCurrentNutrients();
    const maxCal = getMaxRemainingCalories();
    const ignoreLimit = document.getElementById('ignoreCalorieLimit').checked;
    
    // Show loading indicator (optional)
    const calcBtn = document.getElementById('calculateBtn');
    const originalText = calcBtn.textContent;
    calcBtn.textContent = '⚡ Generating...';
    calcBtn.disabled = true;
    
    // Use setTimeout to allow UI update
    setTimeout(() => {
        try {
            const plans = generateOptimalPlans(current, maxCal, ignoreLimit, 20, 10000);
            if (plans.length === 0) {
                alert('No suitable plans found. Try enabling more foods or adjusting stats.');
                calcBtn.textContent = originalText;
                calcBtn.disabled = false;
                return;
            }
            currentOptimalPlans = plans;
            selectedPlanIndex = 0;
            renderPlanList(plans, (idx) => {
                selectedPlanIndex = idx;
                displayPlan(plans[idx], current);
                renderPlanList(plans, (i) => { selectedPlanIndex = i; displayPlan(plans[i], current); renderPlanList(plans, (i2) => {}, selectedPlanIndex); }, selectedPlanIndex);
            }, selectedPlanIndex);
            displayPlan(plans[0], current);
        } catch (err) {
            console.error(err);
            alert('An error occurred while generating plans.');
        } finally {
            calcBtn.textContent = originalText;
            calcBtn.disabled = false;
        }
    }, 10);
}

function generateRandomPlan() {
    const current = getCurrentNutrients();
    const maxCal = getMaxRemainingCalories();
    const ignoreLimit = document.getElementById('ignoreCalorieLimit').checked;
    const plan = generateRandomPlanOnly(current, maxCal, ignoreLimit);
    if (plan) {
        displayPlan(plan, current);
        const section = document.getElementById('optimalPlansSection');
        if (section) section.style.display = 'none';
    } else {
        alert('No foods available to generate a random plan.');
    }
}

function buildFoodUI() {
    const container = document.getElementById('foodListContainer');
    const searchInput = document.getElementById('foodSearch');
    if (!container) return;
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const foods = getAllFoods().filter(f => f.name.toLowerCase().includes(searchTerm));
    container.innerHTML = '';
    for (const food of foods) {
        const div = document.createElement('div');
        div.className = 'food-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = isEnabled(food.name);
        cb.onchange = (e) => {
            toggleFood(food.name, e.target.checked);
            const toggleAll = document.getElementById('toggleAllFoods');
            if (toggleAll) toggleAll.checked = getAllFoods().every(f => isEnabled(f.name));
            // Invalidate any previous plans because available foods changed
            currentOptimalPlans = [];
            selectedPlanIndex = -1;
            const section = document.getElementById('optimalPlansSection');
            if (section) section.style.display = 'none';
        };
        const label = document.createElement('label');
        label.textContent = `${food.name} (C${food.carbs} P${food.protein} F${food.fat} V${food.vitamins} | ${food.cal} cal)`;
        div.appendChild(cb);
        div.appendChild(label);
        container.appendChild(div);
    }
}

function initEventListeners() {
    document.getElementById('toggleFoodPanelBtn').onclick = () => {
        const panel = document.getElementById('foodPanel');
        if (panel) {
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                buildFoodUI();
            } else {
                panel.style.display = 'none';
            }
        }
    };
    document.getElementById('toggleAllFoods').onchange = (e) => {
        const enabled = e.target.checked;
        const allFoods = getAllFoods();
        const newSet = new Set();
        allFoods.forEach(f => { if (enabled) newSet.add(f.name); });
        setEnabledFoods(newSet);
        buildFoodUI();
        currentOptimalPlans = [];
        selectedPlanIndex = -1;
        const section = document.getElementById('optimalPlansSection');
        if (section) section.style.display = 'none';
    };
    document.getElementById('foodSearch').oninput = () => buildFoodUI();
    document.getElementById('calculateBtn').onclick = generateAndShowPlans;
    document.getElementById('randomizeBtn').onclick = generateRandomPlan;
    
    // Update pie charts when inputs change
    const inputs = ['carbs', 'protein', 'fat', 'vitamins', 'curCalories', 'maxCalories', 'ignoreCalorieLimit', 'tier', 'disableTierFilter', 'biomeFilter', 'disableBiomeFilter'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                const nutrients = getCurrentNutrients();
                drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
                if (currentOptimalPlans.length > 0 && selectedPlanIndex >= 0) {
                    // Optionally refresh display with current plan? Maybe not, but we can show the last plan's final numbers
                    // We'll just keep the last plan, but the pie for after might be stale; we could recompute final from last plan but better to leave as is.
                }
            });
            if (el.type === 'number') {
                el.addEventListener('input', () => {
                    const nutrients = getCurrentNutrients();
                    drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
                });
            }
        }
    });
    
    // Initial draw
    const nutrients = getCurrentNutrients();
    drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
    drawPie('afterChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
    buildFoodUI();
}

// Start the application
initEventListeners();