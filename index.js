const { Client, GatewayIntentBits, REST, Routes, ApplicationCommandOptionType, ChannelType } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const TOKEN = 'TU_TOKEN_DEL_BOT';
const CLIENT_ID = '1342902515666260039';
const SERVER_ID_SIN_INVITACION = '1305036939078144010'; // Servidor donde NO se enviará la invitación
const CONFIG_FILE = 'bypass_channels.json';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Cargar configuración de canales
let bypassChannels = {};
if (fs.existsSync(CONFIG_FILE)) {
  bypassChannels = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

// Comandos a registrar
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
  },
  {
    name: 'set-channel',
    description: 'Configura un canal para hacer bypass automático.',
    options: [
      {
        name: 'canal',
        type: ApplicationCommandOptionType.Channel,
        description: 'Elige el canal donde se hará bypass automáticamente.',
        required: true,
        channel_types: [ChannelType.GuildText]
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

    if (!interaction.guild) {
      return interaction.reply({ content: '❌ No puedes usar este comando en mensajes directos.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const apiUrl = `http://fi4.bot-hosting.net:22869/bypass?url=${encodeURIComponent(link)}&key=TestHub-NlF10xdtlxlYVYQhV0lI-mzxnxd`;
      const response = await axios.get(apiUrl);

      console.log(response.data); // Ver la respuesta completa en consola

      const bypassedResult = response.data.result || response.data.link || response.data.url; 

      if (response.data.result?.includes('bypass fail! this proxy has been rate-limited')) {
        return interaction.editReply('⏳ **Espera un momento y vuelve a usar el comando** 🥺');
      }

      let embedDescription = '🔓 **Resultado del bypass:**\n';
      
      if (bypassedResult) {
        if (bypassedResult.startsWith('http')) {
          embedDescription += `[🔗 Click aquí](${bypassedResult})`;
        } else {
          embedDescription += `\`${bypassedResult}\``;
        }
      } else {
        embedDescription = '❌ No se pudo bypassear este enlace.';
      }

      const embed = {
        title: '✅ | Bypass exitoso!',
        description: embedDescription,
        color: parseInt('00FF00', 16), // Verde
        footer: { text: 'MZXN | OFFICIAL', icon_url: client.user?.displayAvatarURL() || '' },
        timestamp: new Date()
      };

      await interaction.editReply({
        content: `${interaction.user} tu enlace ha sido bypasseado.\n\n`,
        embeds: [embed]
      });

      if (bypassedResult && interaction.guild.id !== SERVER_ID_SIN_INVITACION) {
        await interaction.followUp({
          content: `🌐 Únete a nuestro servidor de Discord: https://discord.gg/BtY4vnhxmF`,
          ephemeral: true
        });
      }

    } catch (error) {
      console.error('Error al obtener la respuesta:', error);
      await interaction.editReply({
        embeds: [{
          title: '❌ | Bypass fallido!',
          description: 'No se pudo obtener el enlace.',
          fields: [{ name: '🔒 Error:', value: `\`${error.message || 'Error desconocido'}\`` }],
          color: parseInt('FF0000', 16),
          footer: { text: 'MZXN | OFFICIAL', icon_url: client.user?.displayAvatarURL() || '' },
          timestamp: new Date()
        }]
      });
    }
  }

  // Comando /set-channel
  if (interaction.commandName === 'set-channel') {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('ManageChannels') && interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }

    const canal = interaction.options.getChannel('canal');
    if (!canal || canal.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Debes seleccionar un canal de texto válido.', ephemeral: true });
    }

    bypassChannels[interaction.guild.id] = canal.id;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(bypassChannels, null, 2));

    await interaction.reply({
      content: `✅ Los enlaces enviados en <#${canal.id}> serán bypasseados automáticamente.`,
      ephemeral: true
    });
  }
});

// Manejo de mensajes en el canal configurado
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const canalConfigurado = bypassChannels[message.guild.id];
  if (!canalConfigurado || message.channel.id !== canalConfigurado) return;

  const enlaceRegex = /(https?:\/\/[^\s]+)/g;
  const enlaces = message.content.match(enlaceRegex);

  if (!enlaces) {
    return message.reply('❌ Pon un enlace válido.');
  }

  await message.channel.sendTyping();
  try {
    const apiUrl = `http://fi4.bot-hosting.net:22869/bypass?url=${encodeURIComponent(enlaces[0])}&key=TestHub-NlF10xdtlxlYVYQhV0lI-mzxnxd`;
    const response = await axios.get(apiUrl);

    if (response.data.result?.includes('bypass fail! this proxy has been rate-limited')) {
      return message.reply('⏳ **Espera un momento y vuelve a enviar el enlace** 🥺');
    }

    const bypassedResult = response.data.result || response.data.link || response.data.url;

    let embedDescription = '🔓 **Resultado del bypass:**\n';
    if (bypassedResult) {
      if (bypassedResult.startsWith('http')) {
        embedDescription += `[🔗 Click aquí](${bypassedResult})`;
      } else {
        embedDescription += `\`${bypassedResult}\``;
      }
    } else {
      embedDescription = '❌ No se pudo bypassear este enlace.';
    }

    const embed = {
      title: '✅ | Bypass exitoso!',
      description: embedDescription,
      color: parseInt('00FF00', 16),
      footer: { text: 'MZXN | OFFICIAL', icon_url: client.user?.displayAvatarURL() || '' },
      timestamp: new Date()
    };

    await message.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Error en bypass:', error);
    await message.reply('❌ No se pudo procesar el enlace.');
  }
});

// Iniciar el bot
client.login(TOKEN);
