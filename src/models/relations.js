import { ContextoUsuario } from "./ContextoUsuario.js";
import { Mensaje } from "./message.js";
import User from "./user.js";
import { PerfilInversionista } from "./PerfilInversionista.js";
import { PropuestaPortafolio } from "./PropuestaPortafolio.js";
import { AuditoriaRevision } from "./AuditoriaRevision.js";
import AgentSession from "./agentSession.js";
import AgentSessionEvent from "./agentSessionEvent.js";
import AgentSessionContext from "./agentSessionContext.js";

User.hasMany(Mensaje, { foreignKey: "user_id", constraints: false });
Mensaje.belongsTo(User, { foreignKey: "user_id", constraints: false });

User.hasOne(ContextoUsuario, { foreignKey: "user_id" });
ContextoUsuario.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(PerfilInversionista, { foreignKey: "user_id" });
PerfilInversionista.belongsTo(User, { foreignKey: "user_id" });

PerfilInversionista.hasMany(PropuestaPortafolio, { foreignKey: "perfil_id" });
PropuestaPortafolio.belongsTo(PerfilInversionista, { foreignKey: "perfil_id" });

PropuestaPortafolio.hasMany(AuditoriaRevision, { foreignKey: "propuesta_id" });
AuditoriaRevision.belongsTo(PropuestaPortafolio, { foreignKey: "propuesta_id" });

User.hasMany(AuditoriaRevision, { foreignKey: "asesor_id" });
AuditoriaRevision.belongsTo(User, { foreignKey: "asesor_id" });

User.hasOne(AgentSession, { foreignKey: "userId", constraints: false });
AgentSession.belongsTo(User, { foreignKey: "userId", constraints: false });

AgentSession.hasMany(AgentSessionEvent, { foreignKey: "sessionId" });
AgentSessionEvent.belongsTo(AgentSession, { foreignKey: "sessionId" });

User.hasMany(AgentSessionEvent, { foreignKey: "userId", constraints: false });
AgentSessionEvent.belongsTo(User, { foreignKey: "userId", constraints: false });

AgentSession.hasOne(AgentSessionContext, { foreignKey: "sessionId" });
AgentSessionContext.belongsTo(AgentSession, { foreignKey: "sessionId" });

export {
  User,
  Mensaje,
  ContextoUsuario,
  PerfilInversionista,
  PropuestaPortafolio,
  AuditoriaRevision,
  AgentSession,
  AgentSessionEvent,
  AgentSessionContext,
};