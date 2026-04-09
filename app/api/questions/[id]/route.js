/**
 * GET /api/questions/[id] — получить вопрос по ID
 * PUT /api/questions/[id] — обновить вопрос
 * DELETE /api/questions/[id] — удалить вопрос
 */
import { pool } from '@/lib/db';
import { questionSchema } from '@/lib/schemas/question';

/**
 * GET /api/questions/:id
 * Возвращает вопрос по ID.
 */
export async function GET(request, { params }) {
  if (!pool) {
    return Response.json(
      { success: false, error: 'Database not connected' },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const result = await pool.query(
      'SELECT * FROM questions WHERE id = $1',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching question:', err.message);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/questions/:id
 * Обновляет вопрос. Использует questionSchema для валидации,
 * но делает все поля опциональными (partial), так как ID уже в URL.
 */
export async function PUT(request, { params }) {
  if (!pool) {
    return Response.json(
      { success: false, error: 'Database not connected' },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const questionId = parseInt(id);
    const body = await request.json();

    // Валидируем через partial-схему — все поля опциональны,
    // но если указаны, должны соответствовать требованиям
    const parsed = questionSchema.partial().safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: 'invalid-payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { text, type, options, correct, timeLimit, image, orderAnswer } =
      parsed.data;

    // text обязателен при обновлении
    if (!text) {
      return Response.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE questions
       SET text = $1, type = $2, options = $3, correct = $4,
           time_limit = $5, image = $6, order_answer = $7
       WHERE id = $8`,
      [
        text,
        type || 'multiple_choice',
        options ? JSON.stringify(options) : null,
        correct ? JSON.stringify(correct) : null,
        timeLimit || 30,
        image || null,
        orderAnswer ? JSON.stringify(orderAnswer) : null,
        questionId,
      ]
    );

    return Response.json({ success: true, data: { id: questionId } });
  } catch (err) {
    console.error('Error updating question:', err.message);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/questions/:id
 * Удаляет вопрос по ID.
 */
export async function DELETE(request, { params }) {
  if (!pool) {
    return Response.json(
      { success: false, error: 'Database not connected' },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const result = await pool.query(
      'DELETE FROM questions WHERE id = $1 RETURNING id',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: { id: result.rows[0].id } });
  } catch (err) {
    console.error('Error deleting question:', err.message);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
