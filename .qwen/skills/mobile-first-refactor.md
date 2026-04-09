---
name: mobile-first-refactor
description: Преобразование старой верстки в адаптивную на Tailwind CSS с приоритетом для мобильных устройств. Используй при миграции legacy HTML → React компонентов.
---

# Mobile-First Refactoring Skill

## Контекст
Проект QUIZZ мигрирует с legacy HTML/vanilla JS на **Next.js + React + Tailwind CSS**.
Этот скилл применяется при создании каждого React-компонента из legacy HTML.

## Инструкции

### 1. Анализ текущего HTML/CSS
- Изучи legacy HTML-элемент из `public/index.html` или `public/admin.html`
- Определи его функциональность, инлайн-стили и CSS-классы
- Найди все медиа-запросы и breakpoints

### 2. Viewport & Meta
- Убедись что в `app/layout.js` есть правильный `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`
- Для iOS: добавь `apple-mobile-web-app-capable` и `apple-mobile-web-app-status-bar-style`

### 3. Tailwind Mapping
Замени fixed размеры на адаптивные Tailwind классы:

| Legacy CSS | Tailwind |
|------------|----------|
| `width: 500px` | `w-full max-w-lg` |
| `padding: 20px` | `p-5` |
| `font-size: 16px` | `text-base` |
| `color: #ffffff` | `text-white` |
| `background: #2d1b4e` | `bg-[#2d1b4e]` → затем `bg-secondary` (theme) |
| `border-radius: 12px` | `rounded-xl` |
| `box-shadow: 0 4px 6px rgba(0,0,0,0.3)` | `shadow-lg` |

### 4. Responsive Breakpoints
Используй mobile-first подход — базовые стили для 390px, затем расширение:

```jsx
// ❌ Desktop-first (неправильно)
<div className="md:w-full w-[390px]">

// ✅ Mobile-first (правильно)
<div className="w-full md:max-w-2xl lg:max-w-4xl">
```

**Breakpoints:**
- Base (mobile): 390px (iPhone 14)
- `sm:` 640px
- `md:` 768px (tablet)
- `lg:` 1024px (desktop)
- `xl:` 1280px

### 5. Tap Targets (44x44px minimum)
**ВСЕ** интерактивные элементы должны быть ≥ 44x44px:

```jsx
// ❌ Слишком маленькая кнопка
<button className="px-3 py-1 text-sm">Ответить</button>

// ✅ Правильная кнопка
<button className="min-h-[44px] min-w-[44px] px-6 py-3 text-base">Ответить</button>
```

### 6. Grid / Flex Layouts
- Мобильные: `flex-col` или `grid-cols-1`
- Планшет: `md:flex-row` или `md:grid-cols-2`
- Десктоп: `lg:grid-cols-3`

```jsx
// Варианты ответов — адаптивная сетка
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {options.map(opt => (
    <button key={opt} className="min-h-[44px] p-4 rounded-lg ...">{opt}</button>
  ))}
</div>
```

### 7. Tailwind Theme Config
Создай/обнови `tailwind.config.js` с цветами из `styles/globals.css`:

```js
theme: {
  extend: {
    colors: {
      'bg-primary': '#1a0a2e',
      'bg-secondary': '#2d1b4e',
      'bg-card': '#3d2b5e',
      'text-primary': '#ffffff',
      'text-secondary': '#b8a9c9',
      'accent': '#7c3aed',
      'accent-hover': '#8b5cf6',
      'success': '#10b981',
      'danger': '#ef4444',
      'warning': '#f59e0b',
    },
  },
}
```

### 8. Изображения (Base64)
- На мобильных: `max-w-full h-auto` для предотвращения overflow
- Lazy loading: `loading="lazy"` для изображений вне viewport
- Для Base64:考虑 сжатие на сервере перед отправкой

## Примеры применения

**Пример 1:** "Переделай карточку ответа из index.html так, чтобы она занимала всю ширину на iPhone, но была в две колонки на планшете."

```jsx
<div className="w-full max-w-2xl mx-auto bg-bg-card rounded-xl p-4 md:p-6">
  <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-4">
    {questionText}
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {options.map(opt => (
      <button key={opt} className="min-h-[44px] p-4 rounded-lg border-2 border-accent/30 bg-bg-card text-text-primary hover:bg-accent/10">
        {opt}
      </button>
    ))}
  </div>
</div>
```

**Пример 2:** "Сделай leaderboard адаптивным — на мобильных под вопросом, на десктопе — справа."

```jsx
// На мобильных: порядок 2 (под вопросом)
// На десктопе: порядок 1 (справа, fixed position)
<aside className="order-2 md:order-1 md:fixed md:top-4 md:right-4 md:w-64">
  {/* Leaderboard items */}
</aside>
```
