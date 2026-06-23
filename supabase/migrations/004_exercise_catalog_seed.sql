-- HS 004: Seeder catálogo de ejercicios (60 movimientos)

insert into public.exercise_catalog
  (slug, name, muscle_group, muscle_subgroup, exercise_type, execution_mode, default_prescription, equipment, rest_type, rest_seconds, instructions)
values
  -- PECHO
  ('press-banca-plano', 'Press de banca plano', 'Pecho', 'Pectoral medio', 'compuesto', 'repeticiones', '4×8-10', array['barra','banco_plano'], 'largo', 120, 'Pies firmes, arco lumbar ligero, barra al estern medio, codos 45°.'),
  ('press-banca-inclinado', 'Press inclinado con mancuernas', 'Pecho', 'Pectoral superior', 'compuesto', 'repeticiones', '3×10-12', array['mancuernas','banco_inclinado'], 'medio', 90, 'Banco 30-45°, baja controlada, une mancuernas arriba sin chocar.'),
  ('press-banca-declinado', 'Press declinado', 'Pecho', 'Pectoral inferior', 'compuesto', 'repeticiones', '3×10', array['barra','banco_declinado'], 'medio', 90, 'Agarre medio, codos ligeramente adentro, control en la bajada.'),
  ('aperturas-mancuernas', 'Aperturas con mancuernas', 'Pecho', 'Pectoral medio', 'aislamiento', 'repeticiones', '3×12-15', array['mancuernas','banco_plano'], 'corto', 60, 'Codos semiflexionados, arco amplio, squeeze arriba 1s.'),
  ('cruces-polea-alta', 'Cruces en polea alta', 'Pecho', 'Pectoral inferior', 'aislamiento', 'repeticiones', '3×15', array['polea'], 'corto', 45, 'Torso erguido, brazos cruzan abajo, control al volver.'),
  ('cruces-polea-baja', 'Cruces en polea baja', 'Pecho', 'Pectoral superior', 'aislamiento', 'repeticiones', '3×15', array['polea'], 'corto', 45, 'Eleva brazos en arco hacia el centro del pecho.'),
  ('fondos-paralelas', 'Fondos en paralelas', 'Pecho', 'Pectoral inferior', 'compuesto', 'repeticiones', '3×8-12', array['peso_corporal','paralelas'], 'medio', 90, 'Inclina torso adelante para enfatizar pecho, baja hasta 90°.'),
  ('flexiones', 'Flexiones', 'Pecho', 'Pectoral general', 'compuesto', 'repeticiones', '3×15-20', array['peso_corporal'], 'corto', 45, 'Cuerpo en línea, codos 45°, pecho al suelo.'),

  -- ESPALDA
  ('dominadas', 'Dominadas', 'Espalda', 'Dorsal ancho', 'compuesto', 'repeticiones', '4×6-10', array['peso_corporal','barra_fija'], 'largo', 120, 'Agarre prono ancho, lleva pecho a la barra, baja controlado.'),
  ('jalon-pecho', 'Jalón al pecho', 'Espalda', 'Dorsal ancho', 'compuesto', 'repeticiones', '3×10-12', array['polea','maquina'], 'medio', 75, 'Pecho arriba, lleva barra al pecho alto, aprieta escápulas.'),
  ('remo-barra', 'Remo con barra', 'Espalda', 'Dorsal medio', 'compuesto', 'repeticiones', '4×8-10', array['barra'], 'medio', 90, 'Bisagra de cadera, barra al ombligo, espalda neutra.'),
  ('remo-mancuerna-unilateral', 'Remo mancuerna a una mano', 'Espalda', 'Dorsal medio', 'compuesto', 'repeticiones_por_lado', '3×10 c/l', array['mancuernas','banco_plano'], 'medio', 75, 'Rodilla y mano en banco, tira codo atrás, sin rotar torso.'),
  ('remo-polea-baja', 'Remo en polea baja', 'Espalda', 'Romboides', 'compuesto', 'repeticiones', '3×12', array['polea'], 'medio', 75, 'Torso fijo, codos pegados al cuerpo, squeeze 1s.'),
  ('pullover-polea', 'Pullover en polea', 'Espalda', 'Dorsal ancho', 'aislamiento', 'repeticiones', '3×12-15', array['polea'], 'corto', 60, 'Brazos casi extendidos, arco hasta los muslos.'),
  ('face-pull', 'Face pull', 'Espalda', 'Deltoides posterior', 'aislamiento', 'repeticiones', '3×15-20', array['polea','cuerda'], 'corto', 45, 'Tira a la cara, codos altos, rotación externa al final.'),
  ('peso-muerto-rumano', 'Peso muerto rumano', 'Espalda', 'Erectores / isquios', 'compuesto', 'repeticiones', '3×8-10', array['barra','mancuernas'], 'largo', 120, 'Cadera atrás, barra cerca de piernas, siente estiramiento de isquios.'),

  -- HOMBROS
  ('press-militar', 'Press militar', 'Hombros', 'Deltoides anterior', 'compuesto', 'repeticiones', '4×8-10', array['barra','mancuernas'], 'medio', 90, 'Core tenso, barra frente o detrás, sin arquear exceso lumbar.'),
  ('press-hombro-mancuernas', 'Press de hombro con mancuernas', 'Hombros', 'Deltoides anterior', 'compuesto', 'repeticiones', '3×10', array['mancuernas','banco_inclinado'], 'medio', 75, 'Palmas al frente, sube sin chocar, baja hasta orejas.'),
  ('elevaciones-laterales', 'Elevaciones laterales', 'Hombros', 'Deltoides lateral', 'aislamiento', 'repeticiones', '3×15', array['mancuernas'], 'corto', 45, 'Codos ligeramente flexionados, sube hasta horizontal, control.'),
  ('elevaciones-frontales', 'Elevaciones frontales', 'Hombros', 'Deltoides anterior', 'aislamiento', 'repeticiones', '3×12', array['mancuernas','disco'], 'corto', 45, 'Alterna brazos o simultáneo, sin balanceo.'),
  ('pajaros', 'Pájaros (deltoides posterior)', 'Hombros', 'Deltoides posterior', 'aislamiento', 'repeticiones', '3×15', array['mancuernas'], 'corto', 45, 'Torso inclinado, abre brazos en plano trasero.'),
  ('remo-al-cuello', 'Remo al cuello con barra', 'Hombros', 'Trapecio / deltoides', 'compuesto', 'repeticiones', '3×12', array['barra'], 'corto', 60, 'Barra cerca del cuerpo, codos altos, agarre ancho.'),

  -- BRAZOS
  ('curl-barra', 'Curl con barra', 'Brazos', 'Bíceps', 'aislamiento', 'repeticiones', '3×10-12', array['barra'], 'corto', 60, 'Codos fijos, sube sin impulso, baja 2s.'),
  ('curl-martillo', 'Curl martillo', 'Brazos', 'Braquial / bíceps', 'aislamiento', 'repeticiones', '3×12', array['mancuernas'], 'corto', 60, 'Palmas neutras, alterna o simultáneo.'),
  ('curl-concentrado', 'Curl concentrado', 'Brazos', 'Bíceps pico', 'aislamiento', 'repeticiones_por_lado', '3×10 c/l', array['mancuernas','banco'], 'corto', 45, 'Codo en muslo interno, rango completo.'),
  ('extension-triceps-cuerda', 'Extensión de tríceps en polea', 'Brazos', 'Tríceps', 'aislamiento', 'repeticiones', '3×12-15', array['polea','cuerda'], 'corto', 45, 'Codos pegados, extiende sin abrir codos.'),
  ('fondos-banco', 'Fondos en banco (tríceps)', 'Brazos', 'Tríceps', 'compuesto', 'repeticiones', '3×12-15', array['banco','peso_corporal'], 'corto', 60, 'Manos en banco, baja codos 90°, impulsa con tríceps.'),
  ('press-frances', 'Press francés', 'Brazos', 'Tríceps largo', 'aislamiento', 'repeticiones', '3×10-12', array['barra','mancuernas','banco_plano'], 'corto', 60, 'Baja barra a la frente, codos fijos arriba.'),

  -- PIERNAS
  ('sentadilla-barra', 'Sentadilla con barra', 'Piernas', 'Cuádriceps', 'compuesto', 'repeticiones', '4×6-8', array['barra','rack'], 'largo', 150, 'Pies ancho hombros, baja hasta paralelo o más, rodillas siguen punta de pie.'),
  ('sentadilla-frontal', 'Sentadilla frontal', 'Piernas', 'Cuádriceps', 'compuesto', 'repeticiones', '3×8-10', array['barra','rack'], 'largo', 120, 'Codos altos, torso erguido, profundidad controlada.'),
  ('prensa', 'Prensa de piernas', 'Piernas', 'Cuádriceps', 'compuesto', 'repeticiones', '4×10-12', array['maquina'], 'medio', 90, 'Pies ancho medio, baja sin despegar lumbar, no bloquees rodillas.'),
  ('extension-cuadriceps', 'Extensión de cuádriceps', 'Piernas', 'Cuádriceps', 'aislamiento', 'repeticiones', '3×12-15', array['maquina'], 'corto', 60, 'Extiende sin impulso, pausa arriba, baja lento.'),
  ('zancadas-caminando', 'Zancadas caminando', 'Piernas', 'Cuádriceps / glúteo', 'compuesto', 'repeticiones_por_lado', '3×10 c/l', array['mancuernas','peso_corporal'], 'medio', 75, 'Paso largo, rodilla trasera casi al suelo, torso erguido.'),
  ('zancadas-bulgarias', 'Zancada búlgara', 'Piernas', 'Cuádriceps / glúteo', 'compuesto', 'repeticiones_por_lado', '3×10 c/l', array['mancuernas','banco'], 'medio', 90, 'Pie trasero elevado, baja vertical, rodilla no pasa punta.'),
  ('peso-muerto-convencional', 'Peso muerto convencional', 'Piernas', 'Isquios / glúteo', 'compuesto', 'repeticiones', '4×5-6', array['barra'], 'largo', 180, 'Barra sobre mediopié, empuja suelo con piernas, bloquea cadera arriba.'),
  ('hip-thrust', 'Hip thrust', 'Piernas', 'Glúteo', 'compuesto', 'repeticiones', '4×10-12', array['barra','banco'], 'medio', 90, 'Espalda alta en banco, empuja cadera, pausa arriba.'),
  ('curl-femoral-tumbado', 'Curl femoral tumbado', 'Piernas', 'Isquiosurales', 'aislamiento', 'repeticiones', '3×12', array['maquina'], 'corto', 60, 'Cadera pegada al banco, flexiona sin despegar.'),
  ('curl-femoral-sentado', 'Curl femoral sentado', 'Piernas', 'Isquiosurales', 'aislamiento', 'repeticiones', '3×12', array['maquina'], 'corto', 60, 'Torso fijo, tira talones al glúteo.'),
  ('elevacion-gemelos-pie', 'Elevación de gemelos de pie', 'Piernas', 'Gemelos', 'aislamiento', 'repeticiones', '4×15-20', array['maquina','mancuernas'], 'corto', 45, 'Rango completo, pausa arriba, baja lento.'),
  ('sentadilla-sumo', 'Sentadilla sumo', 'Piernas', 'Aductores / glúteo', 'compuesto', 'repeticiones', '3×10', array['mancuernas','kettlebell'], 'medio', 90, 'Pies muy abiertos, puntas afuera, baja entre piernas.'),

  -- CORE
  ('plancha', 'Plancha', 'Core', 'Abdominales / estabilidad', 'aislamiento', 'isometrico', '3×45-60s', array['peso_corporal'], 'corto', 45, 'Cuerpo recto, glúteos activos, no hundir lumbar.'),
  ('plancha-lateral', 'Plancha lateral', 'Core', 'Oblicuos', 'aislamiento', 'isometrico', '3×30s c/l', array['peso_corporal'], 'corto', 30, 'Cadera arriba, cuerpo en línea, alterna lados.'),
  ('crunch-banco', 'Crunch en banco', 'Core', 'Abdominales', 'aislamiento', 'repeticiones', '3×15-20', array['banco'], 'corto', 45, 'Baja solo ombligo, no tires del cuello.'),
  ('elevacion-piernas', 'Elevación de piernas', 'Core', 'Abdominales inferiores', 'aislamiento', 'repeticiones', '3×12-15', array['peso_corporal','barra_fija'], 'corto', 45, 'Piernas extendidas o flexionadas, controla la bajada.'),
  ('rueda-abdominal', 'Rueda abdominal', 'Core', 'Abdominales / anti-extensión', 'compuesto', 'repeticiones', '3×8-12', array['rueda_abdominal'], 'medio', 75, 'Baja solo hasta mantener lumbar neutra.'),
  ('pallof-press', 'Pallof press', 'Core', 'Oblicuos / anti-rotación', 'aislamiento', 'isometrico', '3×20s c/l', array['polea','banda_elastica'], 'corto', 30, 'Resiste rotación, brazos extendidos al frente.'),

  -- CARDIO / MOVILIDAD
  ('cinta-correr', 'Cinta de correr', 'Cardio', 'Sistema cardiovascular', 'cardio', 'tiempo', '20-30 min', array['cinta'], 'ninguno', 0, 'Ritmo moderado, postura erguida, aterriza suave.'),
  ('bicicleta-estatica', 'Bicicleta estática', 'Cardio', 'Sistema cardiovascular', 'cardio', 'tiempo', '20-30 min', array['bicicleta_estatica'], 'ninguno', 0, 'Cadencia constante, resistencia moderada.'),
  ('remo-ergometro', 'Remo en ergómetro', 'Cardio', 'Cuerpo completo', 'cardio', 'tiempo', '15-20 min', array['maquina_remo'], 'ninguno', 0, 'Impulso piernas, inclina torso, tira con brazos.'),
  ('salto-cuerda', 'Salto de cuerda', 'Cardio', 'Pliometría ligera', 'pliometrico', 'tiempo', '5×2 min', array['cuerda_saltar'], 'activo', 30, 'Saltos bajos, muñecas rotan la cuerda.'),
  ('burpees', 'Burpees', 'Cardio', 'Cuerpo completo', 'pliometrico', 'repeticiones', '4×10', array['peso_corporal'], 'activo', 45, 'Pecho al suelo, salta arriba, ritmo constante.'),
  ('battle-ropes', 'Cuerdas de batalla', 'Cardio', 'Hombros / core', 'cardio', 'tiempo', '6×30s', array['cuerdas_batalla'], 'activo', 30, 'Ondas alternas o simultáneas, core firme.'),
  ('estiramiento-cuadriceps', 'Estiramiento de cuádriceps', 'Movilidad', 'Cuádriceps', 'movilidad', 'tiempo', '2×45s c/l', array['peso_corporal'], 'ninguno', 0, 'Rodilla atrás, empuja cadera adelante, respira profundo.'),
  ('estiramiento-isquios', 'Estiramiento de isquios', 'Movilidad', 'Isquiosurales', 'movilidad', 'tiempo', '2×45s c/l', array['peso_corporal'], 'ninguno', 0, 'Bisagra suave, espalda recta, no rebotes.'),
  ('movilidad-cadera-90-90', 'Movilidad cadera 90/90', 'Movilidad', 'Cadera', 'movilidad', 'tiempo', '2×60s c/l', array['peso_corporal'], 'ninguno', 0, 'Piernas 90°, inclina torso hacia pierna delantera.'),
  ('cat-cow', 'Gato-vaca', 'Movilidad', 'Columna', 'movilidad', 'repeticiones', '2×10', array['peso_corporal'], 'ninguno', 0, 'Alterna flexión y extensión lumbar con la respiración.'),
  ('rotacion-toracica', 'Rotación torácica cuadrupedia', 'Movilidad', 'Torácica', 'movilidad', 'repeticiones_por_lado', '2×8 c/l', array['peso_corporal'], 'ninguno', 0, 'Mano detrás de la cabeza, abre codo al techo.'),
  ('foam-rolling-espalda', 'Foam rolling dorsal', 'Movilidad', 'Dorsal / fascial', 'movilidad', 'tiempo', '2 min', array['foam_roller'], 'ninguno', 0, 'Rueda lenta en zona media de espalda, evita lumbar baja.')
on conflict (slug) do update set
  name = excluded.name,
  muscle_group = excluded.muscle_group,
  muscle_subgroup = excluded.muscle_subgroup,
  exercise_type = excluded.exercise_type,
  execution_mode = excluded.execution_mode,
  default_prescription = excluded.default_prescription,
  equipment = excluded.equipment,
  rest_type = excluded.rest_type,
  rest_seconds = excluded.rest_seconds,
  instructions = excluded.instructions,
  active = true;
