import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { TEMPLATES } from '@/lib/templates';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const dbTemplates = await db.template.findMany({
      where: { isActive: true },
    });

    const allTemplates = [
      ...TEMPLATES.map((t) => ({
        id: `preset-${t.type}`,
        name: t.name,
        nameFa: t.nameFa,
        type: t.type,
        description: t.description,
        descriptionFa: t.descriptionFa,
      })),
      ...dbTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        nameFa: t.nameFa,
        type: t.type,
        description: t.description,
        descriptionFa: t.descriptionFa,
      })),
    ];

    return NextResponse.json({ templates: allTemplates });
  } catch (error) {
    console.error('Templates error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
