'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Множественный выбор' },
  { value: 'true_false', label: 'Правда / Ложь' },
  { value: 'fill_blank', label: 'Заполнить пробел' },
  { value: 'open_ended', label: 'Развёрнутый ответ' },
  { value: 'ordering', label: 'Сортировка' },
  { value: 'matching', label: 'Сопоставление' },
];

export function QuestionEditor({ question, onSave, onCancel }) {
  const [text, setText] = useState(question?.text || '');
  const [type, setType] = useState(question?.type || 'multiple_choice');
  const [timeLimit, setTimeLimit] = useState(question?.timeLimit || 30);
  const [answerType, setAnswerType] = useState(question?.answerType || 'single');
  const [image, setImage] = useState(question?.image || null);
  const [imagePreview, setImagePreview] = useState(question?.image || null);

  // Options & correct
  const [options, setOptions] = useState(question?.options || ['', '']);
  const [correct, setCorrect] = useState(question?.correct || []);

  // Ordering
  const [orderAnswer, setOrderAnswer] = useState(question?.orderAnswer || []);

  // Text answer (fill_blank, open_ended)
  const [textAnswer, setTextAnswer] = useState(question?.options?.[0] || '');

  useEffect(() => {
    if (question?.orderAnswer) setOrderAnswer(question.orderAnswer);
  }, [question]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImage(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (index) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    const newCorrect = correct.filter((c) => c !== index).map((c) => (c > index ? c - 1 : c));
    setOptions(newOptions);
    setCorrect(newCorrect);
  };

  const toggleCorrect = (index) => {
    if (answerType === 'single') {
      setCorrect(correct.includes(index) ? [] : [index]);
    } else {
      setCorrect(
        correct.includes(index) ? correct.filter((c) => c !== index) : [...correct, index]
      );
    }
  };

  const handleOrderItemMove = (index, direction) => {
    const newOrder = [...orderAnswer];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setOrderAnswer(newOrder);
  };

  const handleSave = () => {
    if (!text.trim()) return;

    const questionData = {
      text: text.trim(),
      type,
      timeLimit: Math.max(5, Math.min(300, Number(timeLimit) || 30)),
      image,
    };

    switch (type) {
      case 'multiple_choice':
      case 'true_false':
        questionData.options = options;
        questionData.correct = correct;
        questionData.answerType = type === 'multiple_choice' ? answerType : 'single';
        break;
      case 'fill_blank':
      case 'open_ended':
        questionData.options = [textAnswer];
        questionData.correct = [0];
        break;
      case 'ordering':
        questionData.options = orderAnswer.length > 0 ? orderAnswer : options;
        questionData.correct = orderAnswer.length > 0 ? orderAnswer : options;
        questionData.orderAnswer = orderAnswer.length > 0 ? orderAnswer : options;
        break;
      case 'matching':
        questionData.options = options;
        questionData.correct = correct;
        break;
    }

    onSave(questionData);
  };

  const renderTypeSpecificFields = () => {
    switch (type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-sm text-text-secondary">Тип ответа:</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setAnswerType('single'); setCorrect([]); }} className={`px-3 py-2 rounded text-sm min-h-[44px] ${answerType === 'single' ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary'}`}>
                  Один ответ
                </button>
                <button type="button" onClick={() => { setAnswerType('multiple'); }} className={`px-3 py-2 rounded text-sm min-h-[44px] ${answerType === 'multiple' ? 'bg-accent text-white' : 'bg-bg-primary text-text-secondary'}`}>
                  Несколько
                </button>
              </div>
            </div>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={correct.includes(i)}
                  onChange={() => toggleCorrect(i)}
                  className="w-5 h-5 accent-accent flex-shrink-0"
                />
                <Input value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} placeholder={`Вариант ${i + 1}`} />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="text-danger p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">✕</button>
                )}
              </div>
            ))}
            <Button onClick={addOption} variant="ghost" size="sm" type="button">+ Вариант</Button>
            <p className="text-xs text-text-secondary">Отметьте правильные варианты ☑</p>
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">Выберите правильный ответ:</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCorrect([0])} className={`flex-1 py-3 rounded-lg font-medium min-h-[44px] ${correct.includes(0) ? 'bg-success text-white' : 'bg-bg-primary text-text-secondary border-2 border-accent/30'}`}>
                ✅ Правда
              </button>
              <button type="button" onClick={() => setCorrect([1])} className={`flex-1 py-3 rounded-lg font-medium min-h-[44px] ${correct.includes(1) ? 'bg-danger text-white' : 'bg-bg-primary text-text-secondary border-2 border-accent/30'}`}>
                ❌ Ложь
              </button>
            </div>
          </div>
        );

      case 'fill_blank':
      case 'open_ended':
        return (
          <div className="space-y-3">
            <label className="block text-sm text-text-secondary">
              {type === 'fill_blank' ? 'Правильный ответ:' : 'Ожидаемый ответ:'}
            </label>
            {type === 'open_ended' ? (
              <textarea value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} placeholder="Введите ожидаемый ответ..." className="w-full min-h-[120px] px-4 py-3 bg-bg-card border-2 border-accent/30 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors" />
            ) : (
              <Input value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} placeholder="Правильный ответ" />
            )}
          </div>
        );

      case 'ordering':
        return (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">Элементы в ПРАВИЛЬНОМ порядке (сверху — первый):</p>
            {orderAnswer.length > 0 ? (
              orderAnswer.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-accent font-bold w-6 text-center">{i + 1}</span>
                  <Input value={item} onChange={(e) => { const n = [...orderAnswer]; n[i] = e.target.value; setOrderAnswer(n); }} placeholder={`Элемент ${i + 1}`} />
                  <div className="flex flex-col gap-0">
                    <button type="button" onClick={() => handleOrderItemMove(i, 'up')} className="min-h-[22px] px-2 text-xs text-text-secondary hover:text-text-primary">▲</button>
                    <button type="button" onClick={() => handleOrderItemMove(i, 'down')} className="min-h-[22px] px-2 text-xs text-text-secondary hover:text-text-primary">▼</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-accent font-bold w-6 text-center">{i + 1}</span>
                    <Input value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} placeholder={`Элемент ${i + 1}`} />
                    {options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)} className="text-danger p-2 min-w-[44px]">✕</button>
                    )}
                  </div>
                ))}
                <Button onClick={addOption} variant="ghost" size="sm" type="button">+ Элемент</Button>
              </div>
            )}
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">Пары для сопоставления:</p>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} placeholder={`Вопрос ${Math.floor(i / 2) + 1}`} className="flex-1" />
                <span className="text-text-secondary">↔</span>
                <Input value={options[i + 1] || ''} onChange={(e) => handleOptionChange(i + 1, e.target.value)} placeholder={`Ответ ${Math.floor(i / 2) + 1}`} className="flex-1" />
              </div>
            ))}
            <Button onClick={() => setOptions([...options, '', ''])} variant="ghost" size="sm" type="button">+ Пара</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">
        {question ? 'Редактировать вопрос' : 'Новый вопрос'}
      </h3>
      <div className="space-y-4">
        {/* Тип вопроса */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">Тип вопроса</label>
          <select value={type} onChange={(e) => { setType(e.target.value); setCorrect([]); setOptions(e.target.value === 'true_false' ? ['Правда', 'Ложь'] : ['', '']); }} className="w-full min-h-[44px] px-4 py-3 bg-bg-card border-2 border-accent/30 rounded-lg text-text-primary focus:outline-none focus:border-accent">
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Текст вопроса */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">Текст вопроса</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Введите вопрос..." className="w-full min-h-[80px] px-4 py-3 bg-bg-card border-2 border-accent/30 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors resize-none" />
        </div>

        {/* Время */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">Время на ответ (секунды)</label>
          <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} min={5} max={300} />
        </div>

        {/* Изображение */}
        <div>
          <label className="block text-sm text-text-secondary mb-1">Изображение (необязательно)</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-text-secondary" />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
              <button type="button" onClick={() => { setImage(null); setImagePreview(null); }} className="text-danger text-sm mt-1">Удалить изображение</button>
            </div>
          )}
        </div>

        {/* Type-specific fields */}
        {renderTypeSpecificFields()}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} variant="success" size="md" className="flex-1" type="button">
            Сохранить
          </Button>
          <Button onClick={onCancel} variant="ghost" size="md" className="flex-1" type="button">
            Отмена
          </Button>
        </div>
      </div>
    </Card>
  );
}
