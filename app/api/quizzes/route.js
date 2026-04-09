/**
 * GET /api/quizzes — список всех викторин
 * POST /api/quizzes — создать новую викторину
 */
import { pool } from '@/lib/db';
import { createQuizSchema } from '@/lib/schemas/quiz';

/**
 * GET /api/quizzes
 * Возвращает список викторин с количеством вопросов в каждой.
 */
export async function GET() {
  if (!pool) {
    return Response.json(
      { success: false, error: 'Database not connected' },
      { status: 503 }
    );
  }

  try {
    const result = await pool.query(
      'SELECT * FROM quizzes ORDER BY created_at DESC'
    );

    const quizzes = [];
    for (const row of result.rows) {
      const qResult = await pool.query(
        'SELECT id, text, type, order_index, time_limit FROM questions WHERE quiz_id = $1 ORDER BY order_index',
        [row.id]
      );
      quizzes.push({
        id: row.id,
        name: row.name,
        created_at: row.created_at,
        questionsCount: qResult.rows.length,
      });
    }

    return Response.json({ success: true, data: quizzes });
  } catch (err) {
    console.error('Error fetching quizzes:', err.message);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quizzes
 * Создаёт викторину с валидацией через Zod.
 */
export async function POST(request) {
  if (!pool) {
    return Response.json(
      { success: false, error: 'Database not connected' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createQuizSchema.safeParse(body);

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
      'INSERT INTO quizzes (name) VALUES ($1) RETURNING id, name, created_at',
      [parsed.data.name]
    );

    return Response.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating quiz:', err.message);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
