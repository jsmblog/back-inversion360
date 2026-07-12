import { ContextoUsuario } from "./ContextoUsuario.js";
import { Mensaje } from "./message.js";
import User from "./user.js";
import { PerfilInversionista } from "./PerfilInversionista.js";
import { PropuestaPortafolio } from "./PropuestaPortafolio.js";
import { AuditoriaRevision } from "./AuditoriaRevision.js";

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

export { User, Mensaje, ContextoUsuario, PerfilInversionista, PropuestaPortafolio, AuditoriaRevision };