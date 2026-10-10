# Currency Studio — GitHub Pages

Opublikuj zawartość tego folderu w repozytorium i włącz GitHub Pages (Deploy from a branch / root). Nie wymaga budowania.

## Kursy rynkowe

1. Utwórz konto Twelve Data i uzyskaj klucz: https://twelvedata.com/account/api-keys
2. W aplikacji otwórz „Źródło kursów”, wybierz „Rynkowy · Twelve Data” i wpisz klucz w polu hasła. Kliknij „Połącz”. Nie wpisuj klucza do plików projektu ani do repozytorium.
3. Aplikacja zachowuje klucz tylko w pamięci bieżącej karty. Wysyła go bezpośrednio do Twelve Data; nie utrwala go w localStorage ani raporcie. Po przeładowaniu karty należy połączyć się ponownie.
4. Obsługa walut i limit zapytań zależą od planu Twelve Data. Interfejs pokaże błąd dostępu/limitu zamiast wymyślonego kursu. Sprawdź dostęp swojej pary, szczególnie EUR/PLN i UAH, w planie dostawcy.

Wynik używa pełnej precyzji kursu; kwota jest zaokrąglana dopiero do wyświetlenia. Godzina notowania pochodzi z odpowiedzi API, nie z zegara komputera. Odświeżanie: co minutę, gdy karta jest widoczna i używana w ostatnich 5 minutach; można je wyłączyć. Starsze notowania i nieudane odświeżenie są oznaczone. W weekend dostępna może być ostatnia cena z sesji. Kurs nie musi być identyczny jak w Google: inne źródło, czas i spread.

## Bez klucza

Wybierz jawnie „Dzienny · Frankfurter”. To oddzielne źródło kursów referencyjnych; nie jest przedstawiane jako kurs rynkowy. Nie przełączamy źródeł automatycznie. Historia i raport zapisują źródło, datę/godzinę oraz oznaczenie wcześniejszego kursu. Dzienny kurs zapisany offline może być nieaktualny.

## Opcjonalny publiczny projekt bez klucza odwiedzającego

GitHub Pages obsługuje pliki statyczne. Aby używać własnego klucza dla wszystkich odwiedzających, uruchom własne zabezpieczone proxy HTTPS z kluczem w sekretach serwera, a nie w JavaScript. Pole `marketEndpoint` w `rates-config.js` służy wyłącznie do publicznego adresu takiego proxy. Proxy musi przyjmować `symbol=EUR/PLN`, zwracać `{symbol, rate, timestamp}` zgodnie z Twelve Data oraz mieć CORS dla adresu GitHub Pages, limitowanie zapytań i buforowanie notowań. Tego serwera nie wdrożono w ramach lokalnej aktualizacji.

Źródła: https://twelvedata.com/forex i https://frankfurter.dev/
