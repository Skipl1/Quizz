/**
 * GET /api/quizzes/[id] — викторина с вопросами
 * PUT /api/quizzes/[id] — обновить викторину
 * DELETE /api/quizzes/[id] — удалить викторину (CASCADE)
 */
import { pool } from '@/lib/db';
import { updateQuizSchema } from '@/lib/schemas/quiz';

/**
 * GET /api/quizzes/:id
 * Возвращает викторину со всеми вопросами.
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
    const quizResult = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1',
      [parseInt(id)]
    );

    if (quizResult.rows.length === 0) {
      return Response.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    const qResult = await pool.query(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY order_index',
      [parseInt(id)]
    );

    const quiz = {
      ...quizResult.rows[0],
      questions: qResult.rows.map((q) => ({
        ...q,
        options: q.options,
        correct: q.correct,
        order_answer: q.order_answer,
      })),
    };

    return Response.json({ success: true, data: quiz });
  } catch (err) {
    console.error('Error fetching quiz:', err.message);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quizzes/:id
 * Обновляет название викторины с Zod-валидацией.
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
    const quizId = parseInt(id);
    const body = await request.json();

    // updateQuizSchema требует id и name — id уже в URL,
    // поэтому валидируем только name через частичную схему
    const parsed = updateQuizSchema.pick({ name: true }).safeParse(body);

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

    const result = await pool.query(
      'UPDATE quizzes SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
      [parsed.data.name, quizId]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error updating quiz:', err.message);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quizzes/:id
 * Удаляет викторину и все её вопросы (CASCADE).
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
      'DELETE FROM quizzes WHERE id = $1 RETURNING id',
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: { id: result.rows[0].id } });
  } catch (err) {
    console.error('Error deleting quiz:', err.message);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
