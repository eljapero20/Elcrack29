const { Client, GatewayIntentBits, REST, Routes, ApplicationCommandOptionType } = require('discord.js');
const axios = require('axios');

const TOKEN = 'TU_TOKEN_DEL_BOT';
const CLIENT_ID = '1342902515666260039';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Cargar comandos
const commands = [
  {
    name: 'bypass',
    description: 'Bypassea un enlace.',
    options: [
      {
        name: 'link',
        type: ApplicationCommandOptionType.String,
        description: 'El enlace a bypassear',
        required: true
      }
    ]
  }
];

// Registrar comandos en Discord
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('🔄 Registrando comandos...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Comandos registrados correctamente.');
  } catch (error) {
    console.error('❌ Error registrando comandos:', error);
  }
})();

// Evento cuando el bot está listo
client.once('ready', () => {
  console.log(`✅ Bot iniciado como ${client.user.tag}`);
});

// Manejo de comandos
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'bypass') {
    const link = interaction.options.getString('link');

    // Evitar uso en DMs
    if (!interaction.guild) {
      return interaction.reply({ content: '❌ No puedes usar este comando en mensajes directos.', ephemeral: true });
    }

    await interaction.deferReply(); // Evita que parezca inactivo mientras procesa

    try {
      const apiUrl = `http://fi4.bot-hosting.net:22869/bypass?url=${encodeURIComponent(link)}&key=TestHub-NlF10xdtlxlYVYQhV0lI-mzxnxd`;
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      console.log(response.data); // Ver la respuesta completa en consola

      // Obtener el resultado de la API
      const bypassedResult = response.data.result || response.data.link || response.data.url; 

      let embedDescription = '🔓 **Resultado del bypass:**\n';
      
      if (bypassedResult) {
        // Si el resultado parece un enlace, agregar "Click aquí"
        if (bypassedResult.startsWith('http')) {
          embedDescription += `[🔗 Click aquí](${bypassedResult})`;
        } else {
          // Si es solo texto (por ejemplo, una clave), mostrarlo sin "Click aquí"
          embedDescription += `\`${bypassedResult}\``;
        }
      } else {
        embedDescription = '❌ No se pudo bypassear este enlace.';
      }

      // Crear el embed
      const embed = {
        title: '✅ | Bypass exitoso!',
        description: embedDescription,
        color: parseInt('00FF00', 16), // Verde
        footer: { text: 'MZXN | OFFICIAL', icon_url: client.user?.displayAvatarURL() || '' },
        timestamp: new Date()
      };

      // Enviar mensaje con mención y embed
      await interaction.editReply({
        content: `${interaction.user} tu enlace ha sido bypasseado.\n\n`,
        embeds: [embed]
      });

      // Solo enviar el link del servidor si el bypass fue exitoso
      if (bypassedResult) {
        await interaction.followUp({
          content: `🌐 Únete a nuestro servidor de Discord: https://discord.gg/BtY4vnhxmF`,
          ephemeral: false
        });
      }

    } catch (error) {
      console.error('Error al obtener la respuesta:', error);
      await interaction.editReply({
        embeds: [{
          title: '❌ | Bypass fallido!',
          description: 'No se pudo obtener el enlace.',
          fields: [{ name: '🔒 Error:', value: `\`${error.message || 'Error desconocido'}\`` }],
          color: parseInt('FF0000', 16), // Rojo
          footer: { text: 'MZXN | OFFICIAL', icon_url: client.user?.displayAvatarURL() || '' },
          timestamp: new Date()
        }]
      });
    }
  }
});

// Iniciar el bot
client.login(TOKEN);
