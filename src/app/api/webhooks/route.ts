import Stripe from 'stripe';
import { stripe } from '@/app/stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PointHistory } from '@/type';
import { UserService } from '@/service/useCase/user.service';
import { PointHistoryService } from '@/service/useCase/point-history.service';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('Stripe-Signature') as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!signature) {
    return NextResponse.json(
      {
        message: 'Bad request',
      },
      {
        status: 400,
      }
    );
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.async_payment_succeeded'
    ) {
      return NextResponse.json({
        message: `Hello Stripe end!`,
      });
    }
    /**
     * 支払いが完全に完了している場合のみ処理する
     **/
    if (event.data.object.payment_status === 'paid') {
      const item = await stripe.checkout.sessions.listLineItems(
        event.data.object.id
      );
      const userId = event.data.object.metadata?.userId;
      const point = event.data.object.metadata?.point;

      if (!userId || !point) {
        return NextResponse.json({
          message: `Hello Stripe end!`,
        });
      }

      const user = await UserService.fetchUser(userId);

      if (!user) {
        return NextResponse.json({
          message: `Hello Stripe end!`,
        });
      }

      const newPoint = (user?.point || 0) + +point;
      await UserService.updateUser(user.id, { point: newPoint });

      const pointHistory: Omit<PointHistory, 'id'> = {
        userId,
        historyType: 'purchase',
        point: +point,
        item,
      };
      await PointHistoryService.createPointHistory(pointHistory);

      console.log('決済完了');
      /**
       * カートの中身の情報を利用して、発送業務などのシステムを呼び出す
       **/
    }
    return NextResponse.json({
      message: `Hello Stripe webhook!`,
    });
  } catch (err) {
    const errorMessage = `⚠️  Webhook signature verification failed. ${
      (err as Error).message
    }`;
    console.log(errorMessage);
    return new Response(errorMessage, {
      status: 400,
    });
  }
}
