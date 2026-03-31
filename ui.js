export function drawPie(canvasId, c, p, f, v) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const total = c + p + f + v;
    if (total <= 0) return;
    const vals = [c, p, f, v];
    const colors = ["#e63946", "#f4a261", "#ffcd5d", "#2a9d8f"];
    let start = -Math.PI / 2;
    const cx = w/2, cy = h/2, r = Math.min(w, h) * 0.38;
    for (let i = 0; i < 4; i++) {
        if (vals[i] <= 0) continue;
        const angle = (vals[i] / total) * Math.PI * 2;
        const end = start + angle;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.fillStyle = colors[i];
        ctx.fill();
        start = end;
    }
    ctx.fillStyle = "#ffffffcc";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, 2 * Math.PI);
    ctx.fill();
}

export function displayPlan(plan, currentNutrients) {
    if (!plan) return;
    drawPie('beforeChart', currentNutrients.carbs, currentNutrients.protein, currentNutrients.fat, currentNutrients.vitamins);
    drawPie('afterChart', plan.final.carbs, plan.final.protein, plan.final.fat, plan.final.vitamins);

    const diff = Math.max(plan.final.carbs, plan.final.protein, plan.final.fat, plan.final.vitamins) -
                 Math.min(plan.final.carbs, plan.final.protein, plan.final.fat, plan.final.vitamins);

    const statsDiv = document.getElementById('statsDisplay');
    if (statsDiv) {
        statsDiv.innerHTML = `<div><strong>Current total points:</strong> ${(currentNutrients.carbs + currentNutrients.protein + currentNutrients.fat + currentNutrients.vitamins).toFixed(1)}</div>
        <div><strong>After plan totals:</strong> C=${plan.final.carbs.toFixed(1)} P=${plan.final.protein.toFixed(1)} F=${plan.final.fat.toFixed(1)} V=${plan.final.vitamins.toFixed(1)}</div>`;
    }

    const algebraDiv = document.getElementById('algebraBox');
    if (algebraDiv) {
        algebraDiv.innerHTML = `<strong>🎯 PERFECT QUARTER CHECK</strong><br>Diff (max-min) = ${diff.toFixed(2)} points → ${diff <= 5 ? '✅ BALANCED (25% each)' : '⚠️ Not yet balanced'}`;
    }

    const mealDiv = document.getElementById('mealList');
    if (mealDiv) {
        if (!plan.meals || plan.meals.length === 0) {
            mealDiv.innerHTML = '⚠️ No foods selected.';
        } else {
            const grouped = new Map();
            for (const m of plan.meals) {
                const key = m.food.name;
                if (!grouped.has(key)) grouped.set(key, { servings: 0, food: m.food, totalCal: 0 });
                const e = grouped.get(key);
                e.servings += m.servings;
                e.totalCal += m.food.cal * m.servings;
            }
            let html = '<ul style="margin:6px 0 0 20px;">';
            for (const [_, item] of grouped) {
                html += `<li><b>${item.servings}x ${item.food.name}</b> — +${(item.food.carbs || 0) * item.servings}C / ${(item.food.protein || 0) * item.servings}P / ${(item.food.fat || 0) * item.servings}F / ${(item.food.vitamins || 0) * item.servings}V (${item.totalCal} cal)</li>`;
            }
            html += '</ul>';
            mealDiv.innerHTML = html;
        }
    }

    const calorieInfo = document.getElementById('calorieInfo');
    if (calorieInfo) {
        calorieInfo.innerHTML = `🔥 Calories added: ${plan.caloriesUsed.toFixed(0)}`;
    }

    const totalsDiv = document.getElementById('totalsDisplay');
    if (totalsDiv) {
        totalsDiv.innerHTML = `➕ Totals → Carbs: ${plan.final.carbs.toFixed(1)} | Protein: ${plan.final.protein.toFixed(1)} | Fat: ${plan.final.fat.toFixed(1)} | Vitamins: ${plan.final.vitamins.toFixed(1)} | Calories added: ${plan.caloriesUsed.toFixed(0)}`;
    }

    const balanceDiv = document.getElementById('balanceQuality');
    if (balanceDiv) {
        balanceDiv.innerHTML = diff <= 8 ? `<span class="perfect-badge">🌟 Nutrients balanced within ${diff.toFixed(1)} points! 25% target achieved.</span>` : `<span>⚖️ Balance difference: ${diff.toFixed(1)} points (closer to equal = perfect quarter)</span>`;
    }
}

export function renderPlanList(plans, onSelect, selectedIndex = -1) {
    const container = document.getElementById('optimalPlansContainer');
    const section = document.getElementById('optimalPlansSection');
    if (!container || !section) return;
    if (!plans || plans.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';
    container.innerHTML = '';
    plans.forEach((plan, idx) => {
        const diffVal = Math.max(plan.final.carbs, plan.final.protein, plan.final.fat, plan.final.vitamins) -
                        Math.min(plan.final.carbs, plan.final.protein, plan.final.fat, plan.final.vitamins);
        const card = document.createElement('div');
        card.className = `plan-card ${idx === selectedIndex ? 'active' : ''}`;
        card.innerHTML = `
            <div style="flex:3"><strong>Plan ${idx+1}</strong><br>
            <span class="plan-stats">🥗 C:${plan.final.carbs.toFixed(0)} P:${plan.final.protein.toFixed(0)} F:${plan.final.fat.toFixed(0)} V:${plan.final.vitamins.toFixed(0)} &nbsp;| 🔥 ${plan.caloriesUsed.toFixed(0)} cal</span>
            </div>
            <div><span class="badge-diff">⚖️ diff ${diffVal.toFixed(1)}</span></div>
            <button class="show-plan-btn" data-idx="${idx}" style="background:#2b5e55; padding:6px 16px;">Preview</button>
        `;
        container.appendChild(card);
    });
    document.querySelectorAll('.show-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (!isNaN(idx) && plans[idx]) {
                onSelect(idx);
            }
        });
    });
}