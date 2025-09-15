// src/app/page.tsx  (SERVER component – bez "use client")
import {redirect} from 'next/navigation';

export default function Root() {
  redirect('/pl'); 
}
