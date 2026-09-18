# invitamore-rsvp-react

El hook recibe `IdEvento` para que la API valide que el invitado pertenece al evento indicado:

```js
const rsvp = useRSVP({
	apiBase: "https://api.example.com",
	IdEvento: 123,
});
```