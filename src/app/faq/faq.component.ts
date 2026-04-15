import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    CommonModule, 
    MatExpansionModule, 
    MatIconModule, 
    MatButtonModule,
    MatToolbarModule
  ],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent {

  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }

  faqs = [
    {
      question: '¿Cómo publico un artículo en Circular?',
      answer: '¡Es muy fácil! Iniciá sesión, tocá el botón "Publicaciones" en el menú principal y luego ingresá a la pestaña “Nueva”. Subí una foto clara de tu producto, ponele un título, elegí la categoría adecuada, el precio y contanos un poco sobre su estado. Cuando termines, tocá "Guardar publicación" y tu artículo ya estará visible para toda la comunidad.'
    },
    {
      question: '¿Cómo me comunico con un vendedor de forma segura?',
      answer: 'Para proteger tu privacidad, no es necesario que compartas tu número de WhatsApp. Entrá a la publicación que te interesa y tocá el botón "Enviar mensaje". Esto abrirá un chat privado y en tiempo real dentro de Circular, donde podrán negociar y coordinar la entrega de forma segura.'
    },
    {
      question: 'Ya vendí / compré un artículo, ¿cómo funciona la calificación?',
      answer: 'Una vez que el vendedor marca el artículo como "Vendido" y selecciona quién fue el comprador, ambos verán un botón de "Calificar" en su panel de "Mis Compras / Mis Ventas". Podrán dejarse estrellas y un comentario. ¡Las buenas calificaciones ayudan a que la comunidad confíe más en vos!'
    },
    {
      question: 'Vi un artículo ofensivo o falso, ¿qué debo hacer?',
      answer: 'En Circular nos tomamos muy en serio la seguridad. Si ves algo que viola nuestras reglas, abrí el perfil del usuario, tocá el menú de los tres puntitos (opciones) y seleccioná "Denunciar usuario". Nuestro equipo de moderación revisará el caso de inmediato y tomará las medidas necesarias.'
    },
    {
      question: '¿Es gratis usar Circular?',
      answer: 'Sí, la plataforma es de uso gratuito para toda la comunidad. No se cobran comisiones por publicar ni por concretar ventas. El objetivo es facilitar la economía circular en Argentina.'
    },
    {
      question: '¿Por qué tengo que indicar mi Provincia y Ciudad?',
      answer: 'Circular utiliza tu ubicación para que los usuarios cercanos puedan encontrarte más fácil. Esto facilita que la entrega se haga en mano, evitando costos de envío innecesarios y reduciendo la huella de carbono del transporte.'
    },
    {
      question: '¿Mis datos de contacto son públicos?',
      answer: 'No. Tu correo electrónico está protegido. La comunicación inicial se realiza siempre a través del chat interno de la app. Solo compartís tus datos personales cuando vos lo decidas dentro de la conversación privada.'
    },
    {
      question: '¿Puedo editar el precio de un producto ya publicado?',
      answer: '¡Claro! En tu perfil, dentro de "Mis Publicaciones", seleccioná el producto y elegí "Editar". Podés cambiar el precio, las fotos o la descripción en cualquier momento mientras el artículo esté activo.'
    },
    {
      question: '¿Qué pasa si el comprador no me califica?',
      answer: 'Las calificaciones son voluntarias, pero fundamentales para la confianza. Si el comprador olvida calificarte, tu promedio no bajará, pero siempre recomendamos recordarle amablemente que deje su reseña para ayudarte a crecer en la comunidad.'
    },
    {
      question: '¿Cómo sé si un vendedor es confiable?',
      answer: 'Antes de contactar, entrá al perfil del vendedor. Ahí vas a ver su "Reputación": el promedio de estrellas y los comentarios reales de otras personas que ya realizaron transacciones con él.'
    }
  ];
}