import type { Metadata } from 'next';
import './styles.css';
export const metadata:Metadata={title:'Pilates LAB | Studio Availability',description:'Check private Pilates studio rental availability in Bangtao, Phuket.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
