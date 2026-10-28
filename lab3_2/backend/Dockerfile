FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src src
RUN mvn -B -q package

FROM quay.io/wildfly/wildfly:41.0.1.Final-jdk21
ADD --chown=jboss:jboss https://repo.maven.apache.org/maven2/org/postgresql/postgresql/42.7.7/postgresql-42.7.7.jar /tmp/postgresql.jar
COPY --chown=jboss:jboss wildfly/configure.cli /tmp/configure.cli
RUN /opt/jboss/wildfly/bin/jboss-cli.sh -Dpostgres.jar=/tmp/postgresql.jar --file=/tmp/configure.cli \
    && rm -rf /tmp/postgresql.jar /tmp/configure.cli /opt/jboss/wildfly/standalone/configuration/standalone_xml_history
COPY --from=build --chown=jboss:jboss /build/target/students.war /opt/jboss/wildfly/standalone/deployments/students.war
CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-b", "0.0.0.0", "-c", "standalone-microprofile.xml", "-Djboss.socket.binding.port-offset=0"]
