import { Observable } from "rxjs"


export function getData(){
    return new Observable ((observer) => {
        observer.next(data);
        observer.complete();
    });
}


const data = [
    {
        title:'600 tonna iPhone-t vitt az Apple az USA-ba Indiából Trump vámjai miatt',
        link:'https://itcafe.hu/hir/trump_apple_iphone_vam_india_kina.html',
        description:'Nagyjából 1,5 millió iPhone-ról lehet szó.',
        pubDate:'Fri, 11 Apr 2025 07:00:00 +0200',
        category:'Mérleg'
    },
    {
        title:'A Google és a Microsoft is megölheti a Chrome-ot',
        link:'https://itcafe.hu/hir/google_microsoft_chrome.html',
        description:'A Chrome-ot a Chromium váltja fel, ami egy nyílt forráskódú projekt.',
        pubDate:'Fri, 11 Apr 2025 07:00:00 +0200',
        category:'Mérleg'
    },
    {
        title:'Az Apple új iPhone-t mutatott be',
        link:'https://itcafe.hu/hir/apple_iphone_uj.html',
        description:'Az új iPhone sokkal gyorsabb és szebb lett.',
        pubDate:'Fri, 11 Apr 2025 07:00:00 +0200',
        category:'Mérleg'
    }
]