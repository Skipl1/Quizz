/**
 * POST /api/questions — создать новый вопрос
 */
import { pool } from '@/lib/db';
import { questionSchema } from '@/lib/schemas/question';

/**
 * POST /api/questions
 * Создаёт вопрос с валидацией через Zod.
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
    const parsed = questionSchema.safeParse(body);

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

    const { quizId, text, type, options, correct, timeLimit, image, orderAnswer } =
      parsed.data;

    const result = await pool.query(
      `INSERT INTO questions (quiz_id, text, type, options, correct, time_limit, image, order_answer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        quizId,
        text,
        type,
        JSON.stringify(options),
        JSON.stringify(correct),
        timeLimit || 30,
        image || null,
        orderAnswer ? JSON.stringify(orderAnswer) : null,
      ]
    );

    return Response.json(
      { success: true, data: { id: result.rows[0].id } },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating question:', err.message);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
